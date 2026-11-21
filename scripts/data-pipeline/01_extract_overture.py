#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
DỰ ÁN: "HÔM NAY ĂN GÌ?" - DATA PIPELINE
BƯỚC 1: TRÍCH XUẤT QUÁN ĂN TP.HCM TỪ OVERTURE MAPS (S3 GEOPARQUET -> DUCKDB)
==============================================================================
- Nguồn: Overture Maps Foundation (Places theme)
- Chuẩn: Overture Schema v2.0.0 (taxonomy.primary, taxonomy.hierarchy)
- Bounding Box TP.HCM nội thành: 106.60 -> 106.82 (Kinh độ), 10.70 -> 10.87 (Vĩ độ)
- Chi phí: 0 đồng (Đọc trực tiếp GeoParquet công khai trên Amazon S3)
==============================================================================
"""

import os
import sys
import json
import argparse
import pathlib
import urllib.request
import duckdb

# Đường dẫn thư mục
PIPELINE_DIR = pathlib.Path(__file__).parent.resolve()
DATA_DIR = PIPELINE_DIR / "data"
EXTENSIONS_DIR = PIPELINE_DIR / ".duckdb_extensions"
OUTPUT_FILE = DATA_DIR / "hcmc_raw.json"

STAC_CATALOG_URL = "https://stac.overturemaps.org/catalog.json"
S3_BUCKET_BASE = "s3://overturemaps-us-west-2/release"

# Tọa độ tâm và bán kính tham chiếu cho việc kiểm tra chéo Quận (District Cross-Check)
DISTRICT_CENTROIDS = {
    "quận 1": (10.7760, 106.6980, 4000),
    "q.1": (10.7760, 106.6980, 4000),
    "q1": (10.7760, 106.6980, 4000),
    "district 1": (10.7760, 106.6980, 4000),
    "quận 3": (10.7830, 106.6840, 3500),
    "q.3": (10.7830, 106.6840, 3500),
    "q3": (10.7830, 106.6840, 3500),
    "district 3": (10.7830, 106.6840, 3500),
    "quận 4": (10.7600, 106.7050, 3500),
    "q.4": (10.7600, 106.7050, 3500),
    "q4": (10.7600, 106.7050, 3500),
    "quận 5": (10.7550, 106.6650, 3800),
    "q.5": (10.7550, 106.6650, 3800),
    "q5": (10.7550, 106.6650, 3800),
    "quận 7": (10.7350, 106.7150, 6000),
    "q.7": (10.7350, 106.7150, 6000),
    "q7": (10.7350, 106.7150, 6000),
    "district 7": (10.7350, 106.7150, 6000),
    "quận 10": (10.7720, 106.6670, 3500),
    "q.10": (10.7720, 106.6670, 3500),
    "q10": (10.7720, 106.6670, 3500),
    "bình thạnh": (10.8100, 106.7100, 5000),
    "phú nhuận": (10.7980, 106.6800, 3500),
    "tân bình": (10.8000, 106.6550, 5000),
    "tân phú": (10.7900, 106.6250, 4500),
    "gò vấp": (10.8400, 106.6650, 5000),
    "thủ đức": (10.8500, 106.7650, 9500),
}


def haversine_distance_meters(lat1, lon1, lat2, lon2):
    """Tính khoảng cách Haversine giữa 2 tọa độ (mét)."""
    import math
    R = 6371e3
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (math.sin(delta_phi / 2) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def is_valid_district_coordinate(address: str, lat: float, lng: float) -> bool:
    """Kiểm tra chéo xem tọa độ GPS có bị lệch quận nghiêm trọng (> 2km) so với địa chỉ ghi không."""
    addr_lower = address.lower()
    for district_name, (c_lat, c_lng, max_radius) in DISTRICT_CENTROIDS.items():
        if district_name in addr_lower:
            dist = haversine_distance_meters(lat, lng, c_lat, c_lng)
            # Cho phép tối đa max_radius + 2000m sai số viền quận
            if dist > (max_radius + 2000):
                return False
            return True
    return True  # Nếu không rõ quận thì để AI bước 2 xử lý tiếp


def parse_args():
    parser = argparse.ArgumentParser(
        description="Trích xuất địa điểm ăn uống TP.HCM từ Overture Maps GeoParquet bằng DuckDB."
    )
    parser.add_argument(
        "--limit",
        type=str,
        default="500",
        help="Số lượng quán tối đa cần trích xuất (Mặc định: 500, hoặc 'all' để lấy tất cả)",
    )
    parser.add_argument(
        "--min-confidence",
        type=float,
        default=0.40,
        help="Ngưỡng tin cậy tối thiểu của Overture Maps (Mặc định: 0.40)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(OUTPUT_FILE),
        help=f"Đường dẫn file JSON đầu ra (Mặc định: {OUTPUT_FILE})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Chạy thử nghiệm cú pháp và cấu hình mà không thực hiện query tải toàn bộ S3",
    )
    return parser.parse_args()


def get_latest_overture_release() -> str:
    """Lấy phiên bản release mới nhất từ STAC Catalog của Overture (không hardcode)."""
    print(f"[*] Đang kiểm tra phiên bản Overture Maps mới nhất từ: {STAC_CATALOG_URL} ...")
    try:
        req = urllib.request.Request(
            STAC_CATALOG_URL,
            headers={"User-Agent": "HomNayAnGi-Pipeline/1.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
            latest = data.get("latest")
            if latest:
                print(f"[+] Tìm thấy release mới nhất: {latest}")
                return latest
    except Exception as e:
        print(f"[!] Cảnh báo: Không thể đọc STAC catalog qua HTTP ({e}).")

    # Fallback dự phòng nếu mạng bị chặn
    fallback_release = "2024-11-13.0"
    print(f"[i] Sử dụng phiên bản fallback ổn định: {fallback_release}")
    return fallback_release


def main():
    args = parse_args()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    EXTENSIONS_DIR.mkdir(parents=True, exist_ok=True)

    print("==================================================================")
    print("  HÔM NAY ĂN GÌ? // BƯỚC 1: TRÍCH XUẤT DỮ LIỆU TỪ OVERTURE MAPS")
    print("==================================================================")

    # 1. Khởi tạo DuckDB và cài đặt Extensions (httpfs + spatial)
    print("[*] Khởi tạo DuckDB và nạp extensions (httpfs, spatial)...")
    con = duckdb.connect()
    ext_dir_str = str(EXTENSIONS_DIR).replace("\\", "/")
    con.execute(f"SET extension_directory = '{ext_dir_str}';")
    con.execute("INSTALL httpfs; LOAD httpfs;")
    con.execute("INSTALL spatial; LOAD spatial;")

    # Cấu hình anonymous S3 access cho Overture Maps (us-west-2)
    con.execute("SET s3_region = 'us-west-2';")
    con.execute("SET s3_url_style = 'path';")

    if args.dry_run:
        print("[+] DRY-RUN CHECK: DuckDB, extensions và cấu hình S3 đã sẵn sàng 100%!")
        # Tạo file dữ liệu mẫu cho dry-run nếu chưa có
        if not os.path.exists(args.output):
            sample_data = [
                {
                    "overture_id": "overture_test_001",
                    "name": "Quán Cơm Tấm Sườn Cây Tân Định",
                    "primary_category": "vietnamese_restaurant",
                    "address": "123 Hai Bà Trưng, Phường Tân Định, Quận 1, TP.HCM",
                    "confidence": 0.95,
                    "lat": 10.7915,
                    "lng": 106.6920
                }
            ]
            with open(args.output, "w", encoding="utf-8") as f:
                json.dump(sample_data, f, ensure_ascii=False, indent=2)
            print(f"[+] Đã tạo file mẫu dry-run tại: {args.output}")
        return

    # 2. Lấy phiên bản release Overture mới nhất
    latest_release = get_latest_overture_release()
    s3_path = f"{S3_BUCKET_BASE}/{latest_release}/theme=places/type=place/*"
    print(f"[*] Đường dẫn GeoParquet S3: {s3_path}")

    # 3. Xây dựng câu truy vấn DuckDB tối ưu với Parquet Filter Pushdown
    limit_clause = ""
    if args.limit.lower() != "all":
        try:
            limit_val = int(args.limit)
            limit_clause = f"LIMIT {limit_val}"
        except ValueError:
            print(f"[!] Tham số --limit không hợp lệ: {args.limit}, dùng mặc định 500.")
            limit_clause = "LIMIT 500"

    # Bounding Box TP.HCM nội thành:
    # Bbox: 106.60 <= x <= 106.82 (Kinh độ), 10.70 <= y <= 10.87 (Vĩ độ)
    query = f"""
    SELECT 
        id AS overture_id,
        names.primary AS name,
        taxonomy.primary AS primary_category,
        CONCAT_WS(', ', addresses[1].freeform, addresses[1].locality, 'TP. Hồ Chí Minh') AS address,
        ROUND(confidence, 4) AS confidence,
        ROUND(ST_Y(geometry), 6) AS lat,
        ROUND(ST_X(geometry), 6) AS lng
    FROM read_parquet('{s3_path}', filename=false)
    WHERE 
        -- 1. Tận dụng Parquet partition & Bounding Box filter pushdown
        bbox.xmin >= 106.60 AND bbox.xmax <= 106.82
        AND bbox.ymin >= 10.70 AND bbox.ymax <= 10.87
        
        -- 2. Chỉ lấy nhóm ăn uống (Overture Schema v2.0.0)
        AND list_contains(taxonomy.hierarchy, 'food_and_drink')
        
        -- 3. Loại trừ các địa điểm không phục vụ bữa ăn chính (bar thuần, tiệm trà/cafe thuần, tạp hóa...)
        AND (taxonomy.primary IS NULL OR taxonomy.primary NOT IN (
            'bar', 'pub', 'nightclub', 'hotel_bar', 'cocktail_bar', 'lounge',
            'convenience_store', 'grocery_store', 'supermarket', 'liquor_store',
            'coffee_shop', 'cafe', 'tea_house', 'tea_room', 'bubble_tea_shop',
            'ice_cream_shop', 'bakery'
        ))
        
        -- 4. Bộ lọc chất lượng dữ liệu & địa chỉ hợp lệ
        AND confidence >= {args.min_confidence}
        AND names.primary IS NOT NULL
        AND trim(names.primary) != ''
        AND addresses[1].freeform IS NOT NULL
        AND trim(addresses[1].freeform) != ''
        AND length(trim(addresses[1].freeform)) >= 4
    ORDER BY confidence DESC
    {limit_clause};
    """

    print("[*] Đang thực thi truy vấn GeoParquet qua DuckDB...")
    print("    (Chỉ tải các byte parquet trong phạm vi Bounding Box TP.HCM, không tải toàn bộ dataset)")
    
    try:
        cursor = con.execute(query)
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        raw_records = [dict(zip(columns, row)) for row in rows]
        raw_count = len(raw_records)
        print(f"[+] Trích xuất thô được {raw_count} quán ăn từ Overture Maps.")

        # Áp dụng kiểm tra chéo Quận (District Cross-Check)
        records = []
        dropped_mismatch_count = 0

        for r in raw_records:
            if is_valid_district_coordinate(r.get("address", ""), r.get("lat", 0), r.get("lng", 0)):
                records.append(r)
            else:
                dropped_mismatch_count += 1

        print(f"[✓] Đã lọc bỏ {dropped_mismatch_count} quán bị lệch quận bất thường (> 2km).")
        print(f"[+] Còn lại {len(records)} quán ăn chuẩn xác!")

        output_path = pathlib.Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(records, f, ensure_ascii=False, indent=2)

        print(f"[✓] Đã lưu kết quả tại: {output_path}")
        print("------------------------------------------------------------------")
        print("Ví dụ 3 quán trích xuất được:")
        for r in records[:3]:
            print(f"  • {r['name']} ({r['primary_category']}) - {r['address']} [conf: {r['confidence']}]")
        print("------------------------------------------------------------------")
        print(">>> BƯỚC 1 HOÀN TẤT! Tiếp tục chạy: python 02_enrich_with_ai.py")

    except Exception as e:
        print(f"[X] Lỗi khi truy vấn Overture Maps: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

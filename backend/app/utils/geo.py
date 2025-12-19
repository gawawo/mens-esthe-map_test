import math
from typing import Tuple


def calculate_distance(
    lat1: float,
    lng1: float,
    lat2: float,
    lng2: float,
) -> float:
    """
    2点間の距離をメートルで計算（Haversine formula）

    Args:
        lat1: 地点1の緯度
        lng1: 地点1の経度
        lat2: 地点2の緯度
        lng2: 地点2の経度

    Returns:
        距離（メートル）
    """
    R = 6371000  # 地球の半径（メートル）

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def create_point_wkt(latitude: float, longitude: float) -> str:
    """
    緯度・経度からWKT形式のPOINTを生成

    Args:
        latitude: 緯度
        longitude: 経度

    Returns:
        WKT形式の文字列（例: "POINT(139.7034 35.6938)"）
    """
    return f"POINT({longitude} {latitude})"


def get_bounding_box(
    latitude: float,
    longitude: float,
    radius_meters: float,
) -> Tuple[float, float, float, float]:
    """
    中心座標と半径から矩形範囲を計算

    Args:
        latitude: 中心緯度
        longitude: 中心経度
        radius_meters: 半径（メートル）

    Returns:
        (min_lat, min_lng, max_lat, max_lng)
    """
    # 緯度1度あたりの距離（メートル）
    lat_degree = 111320

    # 経度1度あたりの距離（メートル）- 緯度による補正
    lng_degree = 111320 * math.cos(math.radians(latitude))

    lat_offset = radius_meters / lat_degree
    lng_offset = radius_meters / lng_degree

    return (
        latitude - lat_offset,
        longitude - lng_offset,
        latitude + lat_offset,
        longitude + lng_offset,
    )

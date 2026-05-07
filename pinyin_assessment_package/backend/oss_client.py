"""阿里云 OSS 上传 — 返回公开 URL"""
import base64, time
import oss2
from config import OSS_REGION, OSS_BUCKET, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET


def upload_image_to_oss(base64_image: str) -> str:
    data = base64_image.split(",", 1)[-1]
    buf = base64.b64decode(data)
    auth = oss2.Auth(OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET)
    bucket = oss2.Bucket(auth, f"https://{OSS_REGION}.aliyuncs.com", OSS_BUCKET)
    key = f"sketches/drawing-{int(time.time()*1000)}.png"
    bucket.put_object(key, buf, headers={"Content-Type": "image/png"})
    return f"https://{OSS_BUCKET}.{OSS_REGION}.aliyuncs.com/{key}"

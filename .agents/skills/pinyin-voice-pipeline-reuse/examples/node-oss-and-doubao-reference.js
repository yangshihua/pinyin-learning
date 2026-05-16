/**
 * Reference only: Node.js OSS + Doubao Ark img2img pipeline
 *
 * Flow:
 * 1) upload base64 sketch to OSS
 * 2) call Doubao Ark images generations with OSS url as `image`
 */

const OSS = require('ali-oss');
const axios = require('axios');

const ossClient = new OSS({
  region: process.env.OSS_REGION || 'oss-cn-beijing',
  bucket: process.env.OSS_BUCKET || 'my-sketch-images',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
});

async function uploadToOSS(base64Image, filename) {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const uniqueName = `sketches/${filename}-${Date.now()}.png`;

  const result = await ossClient.put(uniqueName, buffer, {
    headers: { 'Content-Type': 'image/png' },
  });

  return result.url;
}

async function generateWithDoubao({ prompt, imageUrl }) {
  const resp = await axios.post(
    'https://ark.cn-beijing.volces.com/api/v3/images/generations',
    {
      model: 'doubao-seedream-5-0-260128',
      prompt,
      image: imageUrl,
      sequential_image_generation: 'disabled',
      response_format: 'url',
      size: '2K',
      stream: false,
      watermark: true,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DOUBAO_IMAGE_API_KEY}`,
      },
      timeout: 30000,
    }
  );

  return resp.data;
}

module.exports = {
  uploadToOSS,
  generateWithDoubao,
};

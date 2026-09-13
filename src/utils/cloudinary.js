import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.config({
    cloud_name: "dghmvblkt",
    api_key: "744943472684582",
    api_secret: "jjL3PlgvSogdfMUrjSGAcwHgjYU",
});

const imageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'article-images',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    },
});

export const uploadImage = multer({ storage: imageStorage });


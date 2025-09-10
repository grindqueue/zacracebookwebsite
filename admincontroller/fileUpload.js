const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { google } = require("googleapis");
const fs = require("fs");

require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ebooks",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({
  storage: storage,
});

const driveAuth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.type,
    project_id: process.env.google_project_id,
    private_key_id: process.env.google_private_key_id,
    private_key: process.env.google_private_key.replace(/\\n/g, "\n"),
    client_email: process.env.google_client_email,
    client_id: process.env.google_client_id,
    auth_uri: process.env.google_auth_uri,
    token_uri: process.env.google_token_uri,
    client_x509_cert_url: process.env.google_client_x509_cert_url,
    auth_provider_x509_cert_url: process.env.google_auth_provider_x509_cert_url,
    universe_domain: process.env.google_universe_domain,
  },
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});

const drive = google.drive({ version: "v3", auth: driveAuth });


const uploadToDrive = async (file) => {
  const response = await drive.files.create({
    requestBody: {
      name: file.originalname,
      mimeType: file.mimetype,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    },
  });
  return response.data.id;
};

module.exports = { upload, uploadToDrive };

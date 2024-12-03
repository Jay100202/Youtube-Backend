import { v2 as Cloudinary } from "cloudinary";
import fs from "fs";

Cloudinary.config({ 
    cloud_name: "dvzphkcm6", // Replace with your actual cloud name
    api_key: "317931897815264", // Replace with your actual API key
    api_secret: "kifnQTLa8jemLYxHhSH5V_slDyg" // Replace with your actual API secret
});

console.log("Cloudinary Config:", {
    cloud_name: "dvzphkcm6",
    api_key: "317931897815264",
    api_secret: "kifnQTLa8jemLYxHhSH5V_slDyg"
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.log("No local file path provided");
            return null;
        }
        // upload file on cloudinary
        const response = await Cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // file has been uploaded successfully
        console.log("File is uploaded on Cloudinary", response.url);
        fs.unlinkSync(localFilePath); // Uncomment this line to remove the file from local storage after upload
        return response;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        fs.unlinkSync(localFilePath); // remove the file from the local saved file as the upload operation failed
        return null;
    }
};

export default uploadOnCloudinary;
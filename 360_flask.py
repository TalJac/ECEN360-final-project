from flask import Flask, request, jsonify
import os
import torch
from torchvision import transforms
from PIL import Image
import io
import firebase_admin
from flask_cors import CORS
from firebase_admin import credentials, storage

# Suppress irrelevant logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Firebase Admin SDK initialization
cred = credentials.Certificate(r"/home/tjac/Desktop/360_project/ecen-360-final-project-firebase-adminsdk-euuga-baffde5544.json")  # Update with your Firebase Admin SDK JSON file
firebase_admin.initialize_app(cred, {
    'storageBucket': 'ecen-360-final-project.appspot.com'  # Replace with your Firebase bucket name
})

# Load the trained model
class RGBCNN(torch.nn.Module):
    def __init__(self, num_classes):
        super(RGBCNN, self).__init__()
        self.conv_layers = torch.nn.Sequential(
            torch.nn.Conv2d(3, 32, kernel_size=3, padding=1),  # Updated for 3 channels
            torch.nn.BatchNorm2d(32),
            torch.nn.ReLU(),
            torch.nn.MaxPool2d(2),
            torch.nn.Dropout2d(0.2),
            torch.nn.Conv2d(32, 64, kernel_size=3, padding=1),
            torch.nn.BatchNorm2d(64),
            torch.nn.ReLU(),
            torch.nn.MaxPool2d(2),
            torch.nn.Dropout2d(0.3),
            torch.nn.Conv2d(64, 64, kernel_size=3, padding=1),
            torch.nn.BatchNorm2d(64),
            torch.nn.ReLU(),
            torch.nn.MaxPool2d(2),
            torch.nn.Dropout2d(0.3),
            torch.nn.Conv2d(64, 128, kernel_size=3, padding=1),
            torch.nn.BatchNorm2d(128),
            torch.nn.ReLU(),
            torch.nn.MaxPool2d(2),
            torch.nn.Dropout2d(0.4)
        )
        self.fc_layers = torch.nn.Sequential(
            torch.nn.Flatten(),
            torch.nn.Linear(128 * 2 * 2, 128),
            torch.nn.ReLU(),
            torch.nn.Dropout(0.2),
            torch.nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.conv_layers(x)
        x = self.fc_layers(x)
        return x

# Define your specific class names
class_names = [
    'Invalid', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'k', 'l', 'm', 'n', 
    'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y'
]
print(f"Class Names: {class_names}")

# Load the model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = RGBCNN(num_classes=len(class_names)).to(device)
model.load_state_dict(torch.load(r"/home/tjac/Desktop/360_project/best_rgb_model_with_invalid.pth", map_location=device))
model.eval()

# Define the image transformations
transform = transforms.Compose([
    transforms.Resize((32, 32)),
    transforms.ToTensor(),
])

# Function to load and preprocess the image
def load_image(image_file):
    try:
        image_stream = io.BytesIO(image_file.read())
        image = Image.open(image_stream).convert("RGB")  # Ensure RGB format
        return transform(image).unsqueeze(0)  # Add batch dimension
    except Exception as e:
        print(f"Error loading image: {e}")
        return None

# Upload diagnosis result to Firebase Storage
def upload_to_firebase(userID, imageStorageName, prediction):
    try:
        if imageStorageName.endswith('.jpg'):
            imageStorageName = os.path.splitext(imageStorageName)[0]

        bucket = storage.bucket()
        destination_blob_name = f"{userID}/diagnoses/{imageStorageName}_diagnosis.txt"
        diagnosis_text = f"Diagnosis: {prediction}\n"

        temp_filename = f"{imageStorageName}_diagnosis.txt"
        with open(temp_filename, "w") as f:
            f.write(diagnosis_text)

        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(temp_filename)
        print(f"Uploaded diagnosis to {destination_blob_name}")
        os.remove(temp_filename)

    except Exception as e:
        print(f"Error uploading to Firebase: {e}")

# Endpoint to receive images, make predictions, and upload diagnosis to Firebase
@app.route('/predict', methods=['POST'])
def predict_image():
    try:
        image_file = request.files['image']
        image_name = request.form.get('name')
        userID = request.form.get('userID')
        imageStorageName = request.form.get('imageStorageName')

        print(f"Received metadata: Name: {image_name}, UserID: {userID}, ImageStorageName: {imageStorageName}")
        image_tensor = load_image(image_file)

        if image_tensor is not None:
            image_tensor = image_tensor.to(device)
            with torch.no_grad():
                outputs = model(image_tensor)
                _, predicted_class = torch.max(outputs, 1)
                predicted_class_name = class_names[predicted_class.item()]

            print(f"Prediction: {predicted_class_name}")
            upload_to_firebase(userID, imageStorageName, predicted_class_name)
            return jsonify({'prediction': predicted_class_name}), 200
        else:
            return jsonify({'error': 'Image loading failed'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8083)

from tensorflow.keras.models import load_model
import cv2
import numpy as np

model = load_model("brain_tumor_model.h5")

img = cv2.imread("test.jpg")

img = cv2.resize(img, (128,128))

img = np.array(img)/255.0

img = img.reshape(1,128,128,3)

prediction = model.predict(img)

if prediction > 0.5:
    print("Tumor Detected")
else:
    print("No Tumor")
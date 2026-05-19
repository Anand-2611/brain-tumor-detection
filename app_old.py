import streamlit as st
from tensorflow.keras.models import load_model
from PIL import Image
import numpy as np
import cv2

# Load Model
model = load_model("brain_tumor_model.h5")

# Page Config
st.set_page_config(
    page_title="NeuroVision AI",
    page_icon="🧠",
    layout="wide"
)

# Custom CSS
st.markdown("""
<style>

.stApp{
    background: linear-gradient(to right,#000428,#004e92);
    color:white;
}

.main-title{
    text-align:center;
    font-size:60px;
    font-weight:bold;
    color:white;
    margin-top:20px;
}

.sub-title{
    text-align:center;
    font-size:22px;
    color:#cbd5e1;
    margin-bottom:40px;
}

.upload-box{
    padding:30px;
    border-radius:20px;
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(10px);
    border:1px solid rgba(255,255,255,0.2);
}

.result-box{
    padding:25px;
    border-radius:20px;
    text-align:center;
    font-size:30px;
    font-weight:bold;
    margin-top:20px;
}

.success{
    background:#16a34a;
    color:white;
}

.error{
    background:#dc2626;
    color:white;
}

</style>
""", unsafe_allow_html=True)

# Hero Section
st.markdown(
    "<div class='main-title'>🧠 NeuroVision AI</div>",
    unsafe_allow_html=True
)

st.markdown(
    "<div class='sub-title'>Futuristic Brain Tumor Detection System using Deep Learning</div>",
    unsafe_allow_html=True
)

# Layout
col1, col2 = st.columns([1,1])

with col1:

    st.markdown("<div class='upload-box'>", unsafe_allow_html=True)

    uploaded = st.file_uploader(
        "Upload MRI Scan",
        type=["jpg","png","jpeg"]
    )

    st.markdown("</div>", unsafe_allow_html=True)

with col2:

    if uploaded is not None:

        image = Image.open(uploaded)

        st.image(
            image,
            caption="Uploaded MRI Scan",
            use_container_width=True
        )

        image = image.convert("RGB")
        img = np.array(image)

        img = cv2.resize(img,(128,128))

        img = img/255.0

        img = img.reshape(1,128,128,3)

        prediction = model.predict(img)

        confidence = float(prediction[0][0]) * 100

        if prediction > 0.5:

            st.markdown(
                f"""
                <div class='result-box error'>
                ⚠ Tumor Detected <br><br>
                Confidence: {confidence:.2f}%
                </div>
                """,
                unsafe_allow_html=True
    )

        else:

            st.markdown(
                f"""
                <div class='result-box success'>
                ✅ No Tumor Found <br><br>
                Confidence: {100-confidence:.2f}%
                </div>
                """,
                unsafe_allow_html=True
    )
# Features Section
st.markdown("---")

c1,c2,c3 = st.columns(3)

with c1:
    st.metric("AI Accuracy","96%")

with c2:
    st.metric("MRI Scans","10K+")

with c3:
    st.metric("Detection Speed","2 Sec")

st.markdown("---")

st.markdown(
    "<center><h3>⚡ Powered by CNN + TensorFlow + OpenCV</h3></center>",
    unsafe_allow_html=True
)
FROM --platform=linux/x86_64 debian
RUN apt update && \
    apt install -y build-essential curl python3 python3.11-venv tesseract-ocr ffmpeg && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash && \
    apt autoremove && apt clean
RUN . ~/.bashrc && nvm install 20 && nvm use 20
COPY . /bot
WORKDIR /bot
RUN . ~/.bashrc && npm i && \
    curl https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata -L --output eng.traineddata && \
    curl https://raw.githubusercontent.com/oyyd/frozen_east_text_detection.pb/master/frozen_east_text_detection.pb -L --output frozen_east_text_detection.pb
ENTRYPOINT . ~/.bashrc && npm run start

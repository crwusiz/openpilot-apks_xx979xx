FROM docker.io/commaai/openpilot-apks:latest


#base image has default-pure srcs, so delete and put current srcs
RUN rm -rf /tmp/openpilot/apks
RUN mkdir -p /tmp/openpilot/apks
WORKDIR /tmp/openpilot/apks

COPY . /tmp/openpilot/apks


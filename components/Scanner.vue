<template>
  <div class="outer">
    <div v-if="disabled" class="disabled" @click="$emit('disabled')">
      Disabled
    </div>

    <video ref="video" autoplay muted @click="$emit('disable')"></video>

    <div v-if="currentDevice" class="info">
      <span>{{ currentDevice.name }}</span>
      <button v-if="devices.length > 1" @click="onCycle">Change</button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    refreshRate: {
      type: Number,
      default: 250
    }
  },
  data() {
    return {
      devices: [],
      deviceIndex: -1
    };
  },
  computed: {
    currentDevice() {
      return this.devices[this.deviceIndex];
    }
  },
  watch: {
    currentDevice(val) {
      if (!val) {
        return;
      }

      this.loadDevice();
    }
  },
  async mounted() {
    this.detector = new window.BarcodeDetector({
      formats: [
        "upc_e",
        "upc_a",
        "itf",
        "ean_13",
        "ean_8",
        "codabar",
        "code_128",
        "code_39",
        "code_93"
      ]
    });

    this.devices = (await navigator.mediaDevices.enumerateDevices())
      .filter(item => item.kind.includes("video"))
      .map(item => ({
        id: item.deviceId,
        name: item.label.split(" (").shift()
      }));

    this.deviceIndex = 0;

    this.update();
  },
  beforeDestroy() {
    clearTimeout(this.timer);
  },
  methods: {
    async loadDevice() {
      const { id } = this.currentDevice;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: id
        }
      });

      this.$refs.video.srcObject = stream;
    },
    onCycle() {
      this.deviceIndex = (this.deviceIndex + 1) % this.devices.length;
    },
    async update() {
      if (
        this.currentDevice &&
        this.$refs.video &&
        this.$refs.video.readyState === 4
      ) {
        const barcodes = await this.detector.detect(this.$refs.video);

        if (barcodes.length) {
          this.$emit("barcode", barcodes[0].rawValue);
        }
      }

      this.timer = setTimeout(() => {
        this.update();
      }, this.refreshRate);
    }
  }
};
</script>

<style lang="scss" scoped>
.outer {
  position: relative;

  height: 100%;
  width: 100%;

  video {
    width: 100%;
    height: 100%;

    object-fit: contain;
  }
}

.disabled {
  position: absolute;

  top: 0;
  left: 0;

  width: 100%;
  height: 100%;

  backdrop-filter: blur(5px);
  background-color: rgba(255, 255, 255, 0.25);

  display: flex;
  align-items: center;
  justify-content: center;

  font-weight: bold;

  color: black;
}

.info {
  position: absolute;

  bottom: 0;
  left: 0;

  padding: 5px;

  background-color: rgba(0, 0, 0, 0.75);
  color: white;
}
</style>

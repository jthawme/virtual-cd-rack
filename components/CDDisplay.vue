<template>
  <canvas ref="canvas" />
</template>

<script>
import { listenCb, tickUpdate } from "~/assets/js/utils.js";
export default {
  props: {
    width: {
      type: Number,
      required: true
    },
    cds: {
      type: Array,
      required: true
    },
    aimSize: {
      type: Number,
      default: 40
    },
    defaultColor: {
      type: String,
      default: `#e5e5e5`
    }
  },
  computed: {
    perRow() {
      return Math.round(this.width / this.aimSize);
    },
    rows() {
      return Math.ceil(this.cds.length / this.perRow);
    },
    tileSize() {
      return this.width / this.perRow;
    },
    dimensions() {
      return {
        width: this.width,
        height: this.rows * this.tileSize
      };
    },
    tileInfo() {
      return {
        size: this.tileSize,
        perRow: this.perRow
      };
    }
  },
  watch: {
    dimensions: {
      immediate: true,
      handler({ width, height }) {
        if (width && height) {
          this.resize(width, height);
        }
      }
    },
    tileInfo(val) {
      this.$emit("info", val);
    }
  },
  mounted() {
    this.unlisten = [
      listenCb(this.$el, "mousemove", tickUpdate(this.onMove.bind(this))),
      listenCb(this.$el, "touchmove", tickUpdate(this.onMove.bind(this))),
      listenCb(this.$el, "mouseleave", () => {
        this.$emit("index", -1);
      })
    ];

    if (this.dimensions.width && this.dimensions.height) {
      this.resize(this.dimensions.width, this.dimensions.height);
    }
  },
  beforeDestroy() {
    this.unlisten && this.unlisten.forEach(cb => cb());
  },
  methods: {
    onMove(e) {
      const { left, top } = e.target.getBoundingClientRect();

      const x = e.clientX - left;
      const y = e.clientY - top;

      const col = Math.floor(x / this.tileSize);
      const row = Math.floor(y / this.tileSize);

      const index = row * this.perRow + col;

      this.$emit("index", index);
    },
    resize(width, height) {
      const canvas = this.$el;

      if (!canvas) {
        return;
      }

      const dpr = window.devicePixelRatio;
      const ctx = canvas.getContext("2d");

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      this.draw();
    },

    draw() {
      const ctx = this.$refs.canvas.getContext("2d");
      const roundedSize = Math.ceil(this.tileSize);

      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.perRow; x++) {
          if (this.cds[y * this.perRow + x]) {
            ctx.save();
            ctx.translate(x * this.tileSize, y * this.tileSize);
            ctx.fillStyle =
              this.cds[y * this.perRow + x].data.color?.vibrant ||
              this.defaultColor;
            ctx.fillRect(0, 0, roundedSize, roundedSize);
            ctx.restore();
          }
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped></style>

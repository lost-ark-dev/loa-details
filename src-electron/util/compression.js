import zlib from "zlib";

/**
 * Brotli (de)compression utility
 */
export const Brotli = {
  /**
   * Compress a buffer with Brotli compression.
   * @param {Buffer} buffer The buffer to compress
   * @returns {Promise<Buffer>} A promise that resolves to the compressed buffer
   */
  compress(buffer) {
    return new Promise((resolve, reject) => {
      zlib.brotliCompress(
        buffer,
        {
          params: {
            [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          },
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  },

  /**
   * Compress a string with Brotli compression.
   * @param {string} string The string to compress
   * @returns {Promise<Buffer>} The compressed string
   */
  compressString(string, encoding = "utf-8") {
    return new Promise((resolve, reject) => {
      var buffer = Buffer.from(string, encoding);
      zlib.brotliCompress(
        buffer,
        {
          params: {
            [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          },
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });
  },

  /**
   * Decompress a buffer to string format.
   * @param {Buffer} buffer The buffer to decompress.
   * @returns {Promise<String>} A promise that resolves to the decompressed string.
   */
  decompress(buffer, encoding = "utf-8") {
    return new Promise((resolve, reject) => {
      zlib.brotliDecompress(
        buffer,
        {
          params: {
            [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          },
        },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result.toString(encoding));
          }
        }
      );
    });
  },
};

/**
 * Gzip (de)compression utility
 */
export const Gzip = {
  /**
   * Compress a buffer with gzip compression.
   * @param {Buffer} buffer The buffer to compress
   * @returns {Promise<Buffer>} A promise that resolves to the compressed buffer
   */
  compress(buffer) {
    return new Promise((resolve, reject) => {
      zlib.gzip(buffer, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  },

  /**
   * Compress a string with gzip compression.
   * @param {string} string The string to compress
   * @returns {Promise<Buffer>} The compressed string
   */
  compressString(string, encoding = "utf-8") {
    return new Promise((resolve, reject) => {
      var buffer = Buffer.from(string, encoding);
      zlib.gzip(buffer, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  },

  /**
   * Decompress a buffer to string format.
   * @param {Buffer} buffer The buffer to decompress.
   * @returns {Promise<String>} A promise that resolves to the decompressed string.
   */
  decompress(buffer, encoding = "utf-8") {
    return new Promise((resolve, reject) => {
      zlib.gunzip(buffer, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.toString(encoding));
        }
      });
    });
  },
};

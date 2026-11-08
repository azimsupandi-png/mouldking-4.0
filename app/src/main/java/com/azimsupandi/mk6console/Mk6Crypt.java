package com.azimsupandi.mk6console;

/**
 * Mould King 6.0 BLE payload encoder.
 * Builds the 24-byte manufacturer-data payload: address + data, CRC16, then
 * BLE whitening (fixed seed 63 for the inner part, channel seed for the frame).
 */
final class Mk6Crypt {
    private Mk6Crypt() {
    }

    private static int crc16(byte[] addr, byte[] data) {
        int crc = 0xFFFF;
        for (int i = 0; i < addr.length; i++) {
            crc = crcStep(crc ^ (((addr[addr.length - 1 - i] & 0xFF) << 8) & 0xFFFF));
        }
        for (byte b : data) {
            crc = crcStep(crc ^ ((inv8(b & 0xFF) << 8) & 0xFFFF));
        }
        return (inv16(crc) ^ 0xFFFF) & 0xFFFF;
    }

    private static int crcStep(int v) {
        for (int i = 0; i < 8; i++) {
            v = (v & 0x8000) == 0 ? (v << 1) : ((v << 1) ^ 0x1021);
            v &= 0xFFFF;
        }
        return v;
    }

    private static int inv16(int v) {
        int r = 0;
        for (int i = 0; i < 16; i++) {
            if (((1 << i) & v) != 0) r |= 1 << (15 - i);
        }
        return r;
    }

    private static int inv8(int v) {
        int r = 0;
        for (int i = 0; i < 8; i++) {
            if (((1 << i) & v) != 0) r |= 1 << (7 - i);
        }
        return r;
    }

    static byte[] rfPayload(byte[] addr, byte[] data, int channelSeed) {
        int crcPos = 18 + addr.length + data.length;
        int total = crcPos + 2;
        int[] buf = new int[total];
        buf[15] = 0x71;
        buf[16] = 0x0F;
        buf[17] = 0x55;
        for (int i = 0; i < addr.length; i++) {
            buf[18 + i] = addr[addr.length - 1 - i] & 0xFF;
        }
        for (int i = 0; i < data.length; i++) {
            buf[18 + addr.length + i] = data[i] & 0xFF;
        }
        for (int i = 15; i < 18 + addr.length; i++) {
            buf[i] = inv8(buf[i]);
        }
        int crc = crc16(addr, data);
        buf[crcPos] = crc & 0xFF;
        buf[crcPos + 1] = (crc >> 8) & 0xFF;

        whiteningEncode(buf, 18, addr.length + data.length + 2, whiteningInit(63));
        whiteningEncode(buf, 0, total, whiteningInit(channelSeed));

        int len = addr.length + data.length + 5;
        byte[] out = new byte[24];
        int i = 0;
        for (; i < len && i < 24; i++) {
            out[i] = (byte) buf[i + 15];
        }
        for (i = len; i < 24; i++) {
            out[i] = (byte) (i + 1);
        }
        return out;
    }

    private static void whiteningEncode(int[] buf, int off, int len, int[] reg) {
        for (int i = 0; i < len; i++) {
            int v = buf[off + i];
            int r = 0;
            for (int j = 0; j < 8; j++) {
                r |= (whiteningOutput(reg) ^ ((v >> j) & 1)) << j;
            }
            buf[off + i] = r & 0xFF;
        }
    }

    private static int[] whiteningInit(int seed) {
        return new int[]{1, (seed >> 5) & 1, (seed >> 4) & 1, (seed >> 3) & 1,
                (seed >> 2) & 1, (seed >> 1) & 1, seed & 1};
    }

    private static int whiteningOutput(int[] r) {
        int r3 = r[3];
        int r6 = r[6];
        r[3] = r[2];
        r[2] = r[1];
        r[1] = r[0];
        r[0] = r6;
        r[6] = r[5];
        r[5] = r[4];
        r[4] = r3 ^ r6;
        return r6;
    }
}

package android.bluetooth.le;
public final class AdvertiseData {
    public byte[] payload;
    public static final class Builder {
        private final AdvertiseData d = new AdvertiseData();
        public Builder setIncludeDeviceName(boolean b) { return this; }
        public Builder setIncludeTxPowerLevel(boolean b) { return this; }
        public Builder addManufacturerData(int id, byte[] p) { d.payload = p; return this; }
        public AdvertiseData build() { return d; }
    }
}

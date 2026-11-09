package android.bluetooth.le;
public final class AdvertisingSetParameters {
    public static final int INTERVAL_LOW = 160;
    public static final int TX_POWER_HIGH = 1;
    public static final class Builder {
        public Builder setLegacyMode(boolean b) { return this; }
        public Builder setConnectable(boolean b) { return this; }
        public Builder setScannable(boolean b) { return this; }
        public Builder setInterval(int i) { return this; }
        public Builder setTxPowerLevel(int i) { return this; }
        public AdvertisingSetParameters build() { return new AdvertisingSetParameters(); }
    }
}

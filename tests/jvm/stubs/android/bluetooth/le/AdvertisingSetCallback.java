package android.bluetooth.le;
public abstract class AdvertisingSetCallback {
    public static final int ADVERTISE_SUCCESS = 0;
    public void onAdvertisingSetStarted(AdvertisingSet s, int tx, int status) { }
    public void onAdvertisingDataSet(AdvertisingSet s, int status) { }
    public void onAdvertisingSetStopped(AdvertisingSet s) { }
}

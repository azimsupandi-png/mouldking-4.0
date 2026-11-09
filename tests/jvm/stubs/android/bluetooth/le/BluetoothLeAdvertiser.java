package android.bluetooth.le;
import java.util.ArrayList;
import java.util.List;
public class BluetoothLeAdvertiser {
    public final List<AdvertisingSetCallback> started = new ArrayList<>();
    public final List<AdvertisingSetCallback> stopped = new ArrayList<>();
    public void startAdvertisingSet(AdvertisingSetParameters p, AdvertiseData d, Object a, Object b, Object c, AdvertisingSetCallback cb) { started.add(cb); }
    public void stopAdvertisingSet(AdvertisingSetCallback cb) { stopped.add(cb); }
}

package android.bluetooth.le;
import java.util.ArrayList;
import java.util.List;
public class AdvertisingSet {
    public final List<byte[]> sent = new ArrayList<>();
    public void setAdvertisingData(AdvertiseData d) { sent.add(d.payload); }
}

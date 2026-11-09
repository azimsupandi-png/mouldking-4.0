package android.bluetooth;
import android.bluetooth.le.BluetoothLeAdvertiser;
public class BluetoothAdapter {
    public boolean enabled = true;
    public final BluetoothLeAdvertiser adv = new BluetoothLeAdvertiser();
    public boolean isEnabled() { return enabled; }
    public BluetoothLeAdvertiser getBluetoothLeAdvertiser() { return adv; }
}

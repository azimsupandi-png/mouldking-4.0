package android.os;
/** Test stub: a clock the test moves by hand. */
public final class SystemClock {
    public static long now = 1000;
    public static long uptimeMillis() { return now; }
}

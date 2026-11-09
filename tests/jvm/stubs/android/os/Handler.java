package android.os;
import java.util.ArrayList;
import java.util.List;
/** Test stub: runs posted tasks when the test advances the fake clock. */
public class Handler {
    static final class Task { final Runnable r; final long at; final long seq; Task(Runnable r, long at, long seq) { this.r = r; this.at = at; this.seq = seq; } }
    public static final List<Task> QUEUE = new ArrayList<>();
    private static long seq;
    public Handler(Looper l) { }
    public boolean post(Runnable r) { return postDelayed(r, 0); }
    public boolean postDelayed(Runnable r, long d) { QUEUE.add(new Task(r, SystemClock.now + d, seq++)); return true; }
    public void removeCallbacks(Runnable r) { QUEUE.removeIf(t -> t.r == r); }
    public void removeCallbacksAndMessages(Object o) { QUEUE.clear(); }
    /** Advance the clock by ms, running every task that becomes due, in order. */
    public static void advance(long ms) {
        long end = SystemClock.now + ms;
        while (true) {
            Task next = null;
            for (Task t : QUEUE) if (t.at <= end && (next == null || t.at < next.at || (t.at == next.at && t.seq < next.seq))) next = t;
            if (next == null) break;
            QUEUE.remove(next);
            SystemClock.now = Math.max(SystemClock.now, next.at);
            next.r.run();
        }
        SystemClock.now = end;
    }
}

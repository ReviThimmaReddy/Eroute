package com.simats.eroute;

import android.content.Intent;
import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import android.widget.TextView;
import com.simats.eroute.database.AppDatabase;
import com.simats.eroute.database.User;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class StudentDashboardActivity extends AppCompatActivity {
    private ExecutorService executorService = Executors.newSingleThreadExecutor();
    private User currentUser;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_student_dashboard);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        int userId = getIntent().getIntExtra("user_id", -1);
        String userName = getIntent().getStringExtra("user_name");
        String userRole = getIntent().getStringExtra("user_role");

        if (userId != -1) {
            executorService.execute(() -> {
                AppDatabase db = AppDatabase.getInstance(getApplicationContext());
                currentUser = db.appDao().getUserById(userId);
                runOnUiThread(() -> {
                    if (currentUser != null) {
                        updateUI(currentUser);
                    }
                });
            });
        }

        findViewById(R.id.btnLogout).setOnClickListener(v -> {
            android.content.SharedPreferences prefs = getSharedPreferences("EroutePrefs", MODE_PRIVATE);
            prefs.edit().putBoolean("is_logged_in", false).apply();

            Intent intent = new Intent(StudentDashboardActivity.this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
        });
        
        findViewById(R.id.menuApplyPass).setOnClickListener(v -> {
            Intent intent = new Intent(StudentDashboardActivity.this, ApplyPassActivity.class);
            passUserData(intent);
            startActivity(intent);
        });

        findViewById(R.id.menuDigitalPass).setOnClickListener(v -> {
            Intent intent = new Intent(StudentDashboardActivity.this, DigitalPassActivity.class);
            passUserData(intent);
            startActivity(intent);
        });

        findViewById(R.id.menuNotifications).setOnClickListener(v -> {
            Intent intent = new Intent(StudentDashboardActivity.this, NotificationsActivity.class);
            passUserData(intent);
            startActivity(intent);
        });

        findViewById(R.id.menuProfile).setOnClickListener(v -> {
            Intent intent = new Intent(StudentDashboardActivity.this, ProfileActivity.class);
            passUserData(intent);
            startActivity(intent);
        });

        findViewById(R.id.menuInspector).setOnClickListener(v -> {
            Intent intent = new Intent(StudentDashboardActivity.this, DbInspectorActivity.class);
            passUserData(intent);
            startActivity(intent);
        });

        findViewById(R.id.btnSync).setOnClickListener(v -> {
            executorService.execute(() -> {
                AppDatabase db = AppDatabase.getInstance(getApplicationContext());
                // Simulate status update
                if (currentUser != null) {
                    java.util.List<com.simats.eroute.database.BusPass> passes = db.appDao().getBusPassesForUser(currentUser.getId());
                    if (!passes.isEmpty()) {
                        com.simats.eroute.database.BusPass pass = passes.get(0);
                        if (pass.getStatus().equalsIgnoreCase("Submitted")) {
                            pass.setStatus("Verified");
                        } else if (pass.getStatus().equalsIgnoreCase("Verified")) {
                            pass.setStatus("Issued");
                        }
                        db.appDao().updateBusPass(pass);
                        
                        // Firebase Sync
                        DatabaseReference mDatabase = FirebaseDatabase.getInstance("https://eroute-ed29d-default-rtdb.asia-southeast1.firebasedatabase.app/").getReference();
                        mDatabase.child("bus_passes").child(String.valueOf(pass.getUserId())).setValue(pass);
                    }
                }
                runOnUiThread(() -> {
                    android.widget.Toast.makeText(this, "Synchronization complete. Status updated.", android.widget.Toast.LENGTH_SHORT).show();
                });
            });
        });

        findViewById(R.id.btnGetPhpCode).setOnClickListener(v -> {
            new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("Secure Ledger Node")
                .setMessage("Node: sse-eroute-sec-01\nStatus: Active\nAES-256 Protocol: Enabled\nPHP Sync: Localhost/eroute/sync.php")
                .setPositiveButton("OK", null)
                .show();
        });
    }

    private void passUserData(Intent intent) {
        if (currentUser != null) {
            intent.putExtra("user_id", currentUser.getId());
            intent.putExtra("user_name", currentUser.getFullName());
            intent.putExtra("user_role", currentUser.getRole().toUpperCase() + " HUB");
        } else {
            intent.putExtra("user_name", getIntent().getStringExtra("user_name"));
            intent.putExtra("user_role", getIntent().getStringExtra("user_role"));
        }
    }

    private void updateUI(User user) {
        TextView tvHeaderInitial = findViewById(R.id.profileInitial);
        if (tvHeaderInitial != null) {
            String initials = user.getFullName().length() >= 2 ? user.getFullName().substring(0, 2).toUpperCase() : user.getFullName().toUpperCase();
            tvHeaderInitial.setText(initials);
        }
        
        // Update profile section at the bottom
        // (These might need IDs in the layout)
    }
}
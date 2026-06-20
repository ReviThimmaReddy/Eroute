package com.simats.eroute;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import android.content.Intent;
import android.widget.TextView;
import com.simats.eroute.database.AppDatabase;
import com.simats.eroute.database.User;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ConductorDashboardActivity extends AppCompatActivity {
    private ExecutorService executorService = Executors.newSingleThreadExecutor();
    private User currentUser;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_conductor_dashboard);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(android.R.id.content), (v, insets) -> {
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

            Intent intent = new Intent(ConductorDashboardActivity.this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
        });

        findViewById(R.id.menuProfile).setOnClickListener(v -> {
            Intent intent = new Intent(ConductorDashboardActivity.this, ProfileActivity.class);
            passUserData(intent);
            startActivity(intent);
        });

        findViewById(R.id.menuNotifications).setOnClickListener(v -> {
            Intent intent = new Intent(ConductorDashboardActivity.this, NotificationsActivity.class);
            passUserData(intent);
            startActivity(intent);
        });
        
        findViewById(R.id.menuInspector).setOnClickListener(v -> {
            Intent intent = new Intent(ConductorDashboardActivity.this, DbInspectorActivity.class);
            passUserData(intent);
            startActivity(intent);
        });
        
        findViewById(R.id.menuDashboard).setOnClickListener(v -> {
            // Already here
        });

        findViewById(R.id.btnLoadPreset).setOnClickListener(v -> {
            executorService.execute(() -> {
                AppDatabase db = AppDatabase.getInstance(getApplicationContext());
                // Create a sample student if not exists
                User sample = db.appDao().getUserByEmail("sample_student@eroute.com");
                DatabaseReference mDatabase = FirebaseDatabase.getInstance("https://eroute-ed29d-default-rtdb.asia-southeast1.firebasedatabase.app/").getReference();
                if (sample == null) {
                    sample = new User("Sample Student", "REG_SAMPLE", "SSE", "CSE", "0000000000", "Route 101", "sample_student@eroute.com", "password", "student");
                    long sid = db.appDao().insertUser(sample);
                    sample.setId((int)sid);
                    com.simats.eroute.database.BusPass pass = new com.simats.eroute.database.BusPass((int)sid, "Verified", "12/11/2024", "Route 101");
                    db.appDao().insertBusPass(pass);
                    
                    // Firebase Sync
                    mDatabase.child("users").child("sample_student@eroute,com").setValue(sample);
                    mDatabase.child("bus_passes").child(String.valueOf(sid)).setValue(pass);
                }
                runOnUiThread(() -> {
                    android.widget.Toast.makeText(this, "Preset sample data loaded for scanning", android.widget.Toast.LENGTH_SHORT).show();
                });
            });
        });

        findViewById(R.id.btnVerifySignature).setOnClickListener(v -> {
            executorService.execute(() -> {
                AppDatabase db = AppDatabase.getInstance(getApplicationContext());
                java.util.List<com.simats.eroute.database.BusPass> passes = db.appDao().getAllBusPasses();
                boolean found = false;
                for (com.simats.eroute.database.BusPass p : passes) {
                    if (p.getStatus().equalsIgnoreCase("Verified")) {
                        p.setStatus("Issued");
                        db.appDao().updateBusPass(p);
                        
                        // Firebase Sync
                        DatabaseReference mDatabase = FirebaseDatabase.getInstance("https://eroute-ed29d-default-rtdb.asia-southeast1.firebasedatabase.app/").getReference();
                        mDatabase.child("bus_passes").child(String.valueOf(p.getUserId())).setValue(p);

                        found = true;
                        break;
                    }
                }
                final boolean wasFound = found;
                runOnUiThread(() -> {
                    if (wasFound) {
                        android.widget.Toast.makeText(this, "Signature verified. Pass Issued.", android.widget.Toast.LENGTH_SHORT).show();
                    } else {
                        android.widget.Toast.makeText(this, "No verified passes found to sign.", android.widget.Toast.LENGTH_SHORT).show();
                    }
                });
            });
        });

        findViewById(R.id.btnGetPhpCode).setOnClickListener(v -> {
            android.widget.Toast.makeText(this, "Scanner PHP Backend connection active", android.widget.Toast.LENGTH_SHORT).show();
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
    }
}
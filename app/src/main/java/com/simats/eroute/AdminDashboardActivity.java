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

public class AdminDashboardActivity extends AppCompatActivity {
    private ExecutorService executorService = Executors.newSingleThreadExecutor();
    private User currentUser;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_admin_dashboard);
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
                
                int studentCount = db.appDao().getUserCountByRole("student");
                java.util.List<com.simats.eroute.database.BusPass> allPasses = db.appDao().getAllBusPasses();
                
                runOnUiThread(() -> {
                    if (currentUser != null) {
                        updateUI(currentUser);
                        TextView tvTotalStudents = findViewById(R.id.tvTotalStudents);
                        TextView tvTotalApps = findViewById(R.id.tvTotalApps);
                        if (tvTotalStudents != null) tvTotalStudents.setText(String.valueOf(studentCount));
                        if (tvTotalApps != null) tvTotalApps.setText(String.valueOf(allPasses.size()));
                    }
                });
            });
        }

        findViewById(R.id.btnLogout).setOnClickListener(v -> {
            android.content.SharedPreferences prefs = getSharedPreferences("EroutePrefs", MODE_PRIVATE);
            prefs.edit().putBoolean("is_logged_in", false).apply();

            Intent intent = new Intent(AdminDashboardActivity.this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
        });

        findViewById(R.id.menuProfile).setOnClickListener(v -> {
            Intent intent = new Intent(AdminDashboardActivity.this, ProfileActivity.class);
            passUserData(intent);
            startActivity(intent);
        });

        findViewById(R.id.menuNotifications).setOnClickListener(v -> {
            Intent intent = new Intent(AdminDashboardActivity.this, NotificationsActivity.class);
            passUserData(intent);
            startActivity(intent);
        });
        
        findViewById(R.id.menuInspector).setOnClickListener(v -> {
            Intent intent = new Intent(AdminDashboardActivity.this, DbInspectorActivity.class);
            passUserData(intent);
            startActivity(intent);
        });
        
        findViewById(R.id.menuDashboard).setOnClickListener(v -> {
            // Already here
        });

        findViewById(R.id.btnSimulateApplicant).setOnClickListener(v -> {
            executorService.execute(() -> {
                AppDatabase db = AppDatabase.getInstance(getApplicationContext());
                String email = "student" + System.currentTimeMillis() + "@eroute.com";
                User newUser = new User("Generated Student", "REG" + System.currentTimeMillis(), "SSE", "CSE", "9000000000", "Route 101", email, "password123", "student");
                long newId = db.appDao().insertUser(newUser);
                newUser.setId((int)newId);
                com.simats.eroute.database.BusPass pass = new com.simats.eroute.database.BusPass((int)newId, "Submitted", "12/11/2024", "Route 101");
                db.appDao().insertBusPass(pass);
                
                // Firebase Sync
                DatabaseReference mDatabase = FirebaseDatabase.getInstance("https://eroute-ed29d-default-rtdb.asia-southeast1.firebasedatabase.app/").getReference();
                mDatabase.child("users").child(email.replace(".", ",")).setValue(newUser);
                mDatabase.child("bus_passes").child(String.valueOf(newId)).setValue(pass);

                int studentCount = db.appDao().getUserCountByRole("student");
                int passCount = db.appDao().getAllBusPasses().size();
                
                runOnUiThread(() -> {
                    TextView tvTotalStudents = findViewById(R.id.tvTotalStudents);
                    TextView tvTotalApps = findViewById(R.id.tvTotalApps);
                    if (tvTotalStudents != null) tvTotalStudents.setText(String.valueOf(studentCount));
                    if (tvTotalApps != null) tvTotalApps.setText(String.valueOf(passCount));
                    android.widget.Toast.makeText(this, "New applicant generated manually", android.widget.Toast.LENGTH_SHORT).show();
                });
            });
        });

        findViewById(R.id.btnGetPhpCode).setOnClickListener(v -> {
            new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("PHP Backend Code")
                .setMessage("<?php\n// Secure Connection\n$conn = mysqli_connect('localhost', 'admin', 'pass', 'eroute_db');\nif($conn) echo 'Database Synchronized';\n?>")
                .setPositiveButton("Copy", (dialog, which) -> {
                    android.content.ClipboardManager clipboard = (android.content.ClipboardManager) getSystemService(android.content.Context.CLIPBOARD_SERVICE);
                    android.content.ClipData clip = android.content.ClipData.newPlainText("PHP Code", "<?php\n// Secure Connection\n$conn = mysqli_connect('localhost', 'admin', 'pass', 'eroute_db');\nif($conn) echo 'Database Synchronized';\n?>");
                    clipboard.setPrimaryClip(clip);
                    android.widget.Toast.makeText(this, "Copied to clipboard", android.widget.Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton("Close", null)
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
    }
}
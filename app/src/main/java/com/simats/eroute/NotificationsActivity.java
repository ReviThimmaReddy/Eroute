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
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class NotificationsActivity extends AppCompatActivity {
    private ExecutorService executorService = Executors.newSingleThreadExecutor();
    private User currentUser;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_notifications);
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
        } else if (userName != null) {
            TextView tvHeaderName = findViewById(R.id.headerUserName);
            if (tvHeaderName != null) tvHeaderName.setText(userName);
            
            TextView tvHeaderInitial = findViewById(R.id.profileInitial);
            if (tvHeaderInitial != null) {
                String initials = userName.length() >= 2 ? userName.substring(0, 2).toUpperCase() : userName.toUpperCase();
                tvHeaderInitial.setText(initials);
            }
            if (userRole != null) {
                TextView tvHeaderRole = findViewById(R.id.headerUserRole);
                if (tvHeaderRole != null) tvHeaderRole.setText(userRole);
            }
        }

        findViewById(R.id.btnLogout).setOnClickListener(v -> {
            android.content.SharedPreferences prefs = getSharedPreferences("EroutePrefs", MODE_PRIVATE);
            prefs.edit().putBoolean("is_logged_in", false).apply();

            Intent intent = new Intent(NotificationsActivity.this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
        });

        android.view.View menuDashboard = findViewById(R.id.menuDashboard);
        if (menuDashboard != null) {
            menuDashboard.setOnClickListener(v -> {
                Intent intent;
                String role = (currentUser != null) ? currentUser.getRole() : userRole;
                if (role != null && role.toUpperCase().contains("ADMIN")) {
                    intent = new Intent(NotificationsActivity.this, AdminDashboardActivity.class);
                } else if (role != null && role.toUpperCase().contains("OFFICER")) {
                    intent = new Intent(NotificationsActivity.this, OfficerDashboardActivity.class);
                } else if (role != null && role.toUpperCase().contains("CONDUCTOR")) {
                    intent = new Intent(NotificationsActivity.this, ConductorDashboardActivity.class);
                } else {
                    intent = new Intent(NotificationsActivity.this, StudentDashboardActivity.class);
                }
                passUserData(intent);
                startActivity(intent);
                finish();
            });
        }

        android.view.View menuApplyPass = findViewById(R.id.menuApplyPass);
        if (menuApplyPass != null) {
            menuApplyPass.setOnClickListener(v -> {
                Intent intent = new Intent(NotificationsActivity.this, ApplyPassActivity.class);
                passUserData(intent);
                startActivity(intent);
                finish();
            });
        }

        android.view.View menuDigitalPass = findViewById(R.id.menuDigitalPass);
        if (menuDigitalPass != null) {
            menuDigitalPass.setOnClickListener(v -> {
                Intent intent = new Intent(NotificationsActivity.this, DigitalPassActivity.class);
                passUserData(intent);
                startActivity(intent);
                finish();
            });
        }

        android.view.View menuProfile = findViewById(R.id.menuProfile);
        if (menuProfile != null) {
            menuProfile.setOnClickListener(v -> {
                Intent intent = new Intent(NotificationsActivity.this, ProfileActivity.class);
                passUserData(intent);
                startActivity(intent);
                finish();
            });
        }

        android.view.View menuInspector = findViewById(R.id.menuInspector);
        if (menuInspector != null) {
            menuInspector.setOnClickListener(v -> {
                Intent intent = new Intent(NotificationsActivity.this, DbInspectorActivity.class);
                passUserData(intent);
                startActivity(intent);
                finish();
            });
        }
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
        TextView tvHeaderName = findViewById(R.id.headerUserName);
        if (tvHeaderName != null) tvHeaderName.setText(user.getFullName());
        
        TextView tvHeaderInitial = findViewById(R.id.profileInitial);
        if (tvHeaderInitial != null) {
            String initials = user.getFullName().length() >= 2 ? user.getFullName().substring(0, 2).toUpperCase() : user.getFullName().toUpperCase();
            tvHeaderInitial.setText(initials);
        }
        
        TextView tvHeaderRole = findViewById(R.id.headerUserRole);
        if (tvHeaderRole != null) tvHeaderRole.setText(user.getRole().toUpperCase() + " HUB");
    }
}
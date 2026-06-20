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

public class DigitalPassActivity extends AppCompatActivity {
    private ExecutorService executorService = Executors.newSingleThreadExecutor();
    private User currentUser;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_digital_pass);
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
                java.util.List<com.simats.eroute.database.BusPass> passes = db.appDao().getBusPassesForUser(userId);
                runOnUiThread(() -> {
                    if (currentUser != null) {
                        updateUI(currentUser);
                        if (!passes.isEmpty()) {
                            com.simats.eroute.database.BusPass pass = passes.get(0);
                            TextView tvTitle = findViewById(R.id.tvPassTitle);
                            TextView tvDesc = findViewById(R.id.tvPassDesc);
                            android.widget.ImageView ivQr = findViewById(R.id.ivQrPass);
                            
                            if (pass.getStatus().equalsIgnoreCase("Issued")) {
                                if (ivQr != null) ivQr.setImageTintList(android.content.res.ColorStateList.valueOf(getResources().getColor(R.color.white)));
                                if (tvTitle != null) tvTitle.setText("Active Digital Pass");
                                if (tvDesc != null) tvDesc.setText("Valid for " + pass.getRoute());
                            } else {
                                if (tvTitle != null) tvTitle.setText("Pass Pending");
                                if (tvDesc != null) tvDesc.setText("Current Status: " + pass.getStatus());
                                if (ivQr != null) ivQr.setImageTintList(android.content.res.ColorStateList.valueOf(getResources().getColor(R.color.text_secondary)));
                            }
                        } else {
                            TextView tvTitle = findViewById(R.id.tvPassTitle);
                            TextView tvDesc = findViewById(R.id.tvPassDesc);
                            if (tvTitle != null) tvTitle.setText("No Pass Found");
                            if (tvDesc != null) tvDesc.setText("Please apply for a pass in the Apply section.");
                        }
                    }
                });
            });
        }
else if (userName != null) {
            ((TextView) findViewById(R.id.profileInitial)).setText(userName.substring(0, 2).toUpperCase());
        }

        findViewById(R.id.btnLogout).setOnClickListener(v -> {
            android.content.SharedPreferences prefs = getSharedPreferences("EroutePrefs", MODE_PRIVATE);
            prefs.edit().putBoolean("is_logged_in", false).apply();

            Intent intent = new Intent(DigitalPassActivity.this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
        });

        findViewById(R.id.menuDashboard).setOnClickListener(v -> {
            Intent intent = new Intent(DigitalPassActivity.this, StudentDashboardActivity.class);
            passUserData(intent);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.menuApplyPass).setOnClickListener(v -> {
            Intent intent = new Intent(DigitalPassActivity.this, ApplyPassActivity.class);
            passUserData(intent);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.menuDigitalPass).setOnClickListener(v -> {
            // Already here
        });

        findViewById(R.id.menuNotifications).setOnClickListener(v -> {
            Intent intent = new Intent(DigitalPassActivity.this, NotificationsActivity.class);
            passUserData(intent);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.menuProfile).setOnClickListener(v -> {
            Intent intent = new Intent(DigitalPassActivity.this, ProfileActivity.class);
            passUserData(intent);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.menuInspector).setOnClickListener(v -> {
            Intent intent = new Intent(DigitalPassActivity.this, DbInspectorActivity.class);
            passUserData(intent);
            startActivity(intent);
            finish();
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
        TextView tvProfileInitial = findViewById(R.id.profileInitial);
        if (tvProfileInitial != null) {
            String initials = user.getFullName().length() >= 2 ? user.getFullName().substring(0, 2).toUpperCase() : user.getFullName().toUpperCase();
            tvProfileInitial.setText(initials);
        }
    }
}
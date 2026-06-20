package com.simats.eroute;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.simats.eroute.database.AppDatabase;
import com.simats.eroute.database.User;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ProfileActivity extends AppCompatActivity {
    private ExecutorService executorService = Executors.newSingleThreadExecutor();
    private User currentUser;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_profile);
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
            TextView tvProfileName = findViewById(R.id.profileName);
            if (tvProfileName != null) tvProfileName.setText(userName);
            String initials = userName.length() >= 2 ? userName.substring(0, 2).toUpperCase() : userName.toUpperCase();
            TextView tvHeaderInitial = findViewById(R.id.profileInitial);
            if (tvHeaderInitial != null) tvHeaderInitial.setText(initials);
            TextView tvProfileIconInitial = findViewById(R.id.profileIconInitial);
            if (tvProfileIconInitial != null) tvProfileIconInitial.setText(initials);
            if (userRole != null) {
                TextView tvHeaderRole = findViewById(R.id.headerUserRole);
                if (tvHeaderRole != null) tvHeaderRole.setText(userRole);
                String roleText = userRole.replace(" BADGE", "").replace(" HUB", "").toUpperCase();
                TextView tvAuthLevel = findViewById(R.id.tvAuthLevel);
                if (tvAuthLevel != null) tvAuthLevel.setText(roleText);
            }
        }

        findViewById(R.id.btnResetPassword).setOnClickListener(v -> {
            EditText etNewPass = findViewById(R.id.etNewPassword);
            String newPass = etNewPass.getText().toString().trim();
            if (newPass.isEmpty()) {
                Toast.makeText(this, "Enter new password", Toast.LENGTH_SHORT).show();
                return;
            }
            if (currentUser != null) {
                executorService.execute(() -> {
                    AppDatabase db = AppDatabase.getInstance(getApplicationContext());
                    db.appDao().updatePassword(currentUser.getId(), newPass);
                    
                    // Firebase Sync
                    DatabaseReference mDatabase = FirebaseDatabase.getInstance("https://eroute-ed29d-default-rtdb.asia-southeast1.firebasedatabase.app/").getReference();
                    mDatabase.child("users").child(currentUser.getEmail().replace(".", ",")).child("password").setValue(newPass);

                    runOnUiThread(() -> {
                        Toast.makeText(this, "Password updated successfully in database", Toast.LENGTH_SHORT).show();
                        etNewPass.setText("");
                    });
                });
            } else {
                Toast.makeText(this, "Password reset successful (Simulated)", Toast.LENGTH_SHORT).show();
            }
        });

        findViewById(R.id.btnLogout).setOnClickListener(v -> {
            android.content.SharedPreferences prefs = getSharedPreferences("EroutePrefs", MODE_PRIVATE);
            prefs.edit().putBoolean("is_logged_in", false).apply();

            Intent intent = new Intent(ProfileActivity.this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
        });

        View menuDashboard = findViewById(R.id.menuDashboard);
        if (menuDashboard != null) {
            menuDashboard.setOnClickListener(v -> {
                Intent intent;
                String role = (currentUser != null) ? currentUser.getRole() : userRole;
                if (role != null && role.toUpperCase().contains("ADMIN")) {
                    intent = new Intent(ProfileActivity.this, AdminDashboardActivity.class);
                } else if (role != null && role.toUpperCase().contains("OFFICER")) {
                    intent = new Intent(ProfileActivity.this, OfficerDashboardActivity.class);
                } else if (role != null && role.toUpperCase().contains("CONDUCTOR")) {
                    intent = new Intent(ProfileActivity.this, ConductorDashboardActivity.class);
                } else {
                    intent = new Intent(ProfileActivity.this, StudentDashboardActivity.class);
                }
                if (currentUser != null) {
                    intent.putExtra("user_id", currentUser.getId());
                    intent.putExtra("user_name", currentUser.getFullName());
                    intent.putExtra("user_role", currentUser.getRole().toUpperCase() + " HUB");
                } else {
                    intent.putExtra("user_name", userName);
                    intent.putExtra("user_role", userRole);
                }
                startActivity(intent);
                finish();
            });
        }

        View menuApplyPass = findViewById(R.id.menuApplyPass);
        if (menuApplyPass != null) {
            menuApplyPass.setOnClickListener(v -> {
                Intent intent = new Intent(ProfileActivity.this, ApplyPassActivity.class);
                if (currentUser != null) {
                    intent.putExtra("user_id", currentUser.getId());
                    intent.putExtra("user_name", currentUser.getFullName());
                    intent.putExtra("user_role", currentUser.getRole().toUpperCase() + " HUB");
                } else {
                    intent.putExtra("user_name", userName);
                    intent.putExtra("user_role", userRole);
                }
                startActivity(intent);
                finish();
            });
        }

        View menuDigitalPass = findViewById(R.id.menuDigitalPass);
        if (menuDigitalPass != null) {
            menuDigitalPass.setOnClickListener(v -> {
                Intent intent = new Intent(ProfileActivity.this, DigitalPassActivity.class);
                if (currentUser != null) {
                    intent.putExtra("user_id", currentUser.getId());
                    intent.putExtra("user_name", currentUser.getFullName());
                    intent.putExtra("user_role", currentUser.getRole().toUpperCase() + " HUB");
                } else {
                    intent.putExtra("user_name", userName);
                    intent.putExtra("user_role", userRole);
                }
                startActivity(intent);
                finish();
            });
        }

        View menuNotifications = findViewById(R.id.menuNotifications);
        if (menuNotifications != null) {
            menuNotifications.setOnClickListener(v -> {
                Intent intent = new Intent(ProfileActivity.this, NotificationsActivity.class);
                if (currentUser != null) {
                    intent.putExtra("user_id", currentUser.getId());
                    intent.putExtra("user_name", currentUser.getFullName());
                    intent.putExtra("user_role", currentUser.getRole().toUpperCase() + " HUB");
                } else {
                    intent.putExtra("user_name", userName);
                    intent.putExtra("user_role", userRole);
                }
                startActivity(intent);
                finish();
            });
        }

        View menuInspector = findViewById(R.id.menuInspector);
        if (menuInspector != null) {
            menuInspector.setOnClickListener(v -> {
                Intent intent = new Intent(ProfileActivity.this, DbInspectorActivity.class);
                if (currentUser != null) {
                    intent.putExtra("user_id", currentUser.getId());
                    intent.putExtra("user_name", currentUser.getFullName());
                    intent.putExtra("user_role", currentUser.getRole().toUpperCase() + " HUB");
                } else {
                    intent.putExtra("user_name", userName);
                    intent.putExtra("user_role", userRole);
                }
                startActivity(intent);
                finish();
            });
        }
    }

    private void updateUI(User user) {
        TextView tvHeaderName = findViewById(R.id.headerUserName);
        if (tvHeaderName != null) tvHeaderName.setText(user.getFullName());
        TextView tvProfileName = findViewById(R.id.profileName);
        if (tvProfileName != null) tvProfileName.setText(user.getFullName());
        String initials = user.getFullName().length() >= 2 ? user.getFullName().substring(0, 2).toUpperCase() : user.getFullName().toUpperCase();
        TextView tvHeaderInitial = findViewById(R.id.profileInitial);
        if (tvHeaderInitial != null) tvHeaderInitial.setText(initials);
        TextView tvProfileIconInitial = findViewById(R.id.profileIconInitial);
        if (tvProfileIconInitial != null) tvProfileIconInitial.setText(initials);
        TextView tvHeaderRole = findViewById(R.id.headerUserRole);
        if (tvHeaderRole != null) tvHeaderRole.setText(user.getRole().toUpperCase() + " HUB");
        TextView tvAuthLevel = findViewById(R.id.tvAuthLevel);
        if (tvAuthLevel != null) tvAuthLevel.setText(user.getRole().toUpperCase());
        TextView tvEmail = findViewById(R.id.tvContactEmail);
        if (tvEmail != null) tvEmail.setText(user.getEmail());
        TextView tvLoggedId = findViewById(R.id.profileLoggedId);
        if (tvLoggedId != null) tvLoggedId.setText("System logged ID: " + user.getId());
    }
}
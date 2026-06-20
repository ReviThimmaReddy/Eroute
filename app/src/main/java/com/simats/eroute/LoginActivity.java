package com.simats.eroute;

import android.content.Intent;
import android.os.Bundle;
import android.widget.EditText;
import android.widget.TextView;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import android.widget.Toast;
import com.simats.eroute.database.AppDatabase;
import com.simats.eroute.database.User;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class LoginActivity extends AppCompatActivity {
    private ExecutorService executorService = Executors.newSingleThreadExecutor();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_login);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(android.R.id.content), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Initialize default users if empty
        executorService.execute(() -> {
            AppDatabase db = AppDatabase.getInstance(getApplicationContext());
            if (db.appDao().getUserByEmail("student@eroute.com") == null) {
                DatabaseReference mDatabase = FirebaseDatabase.getInstance("https://eroute-ed29d-default-rtdb.asia-southeast1.firebasedatabase.app/").getReference();
                
                User[] defaults = {
                    new User("Revi Thimma Reddy Kc", "REG2026001", "SSE", "CSE", "9876543210", "Route 101", "student@eroute.com", "password123", "student"),
                    new User("Prof. Sarah", "ADM001", "SSE", "ADMIN", "9876543211", "N/A", "admin@eroute.com", "password123", "admin"),
                    new User("Officer David", "OFF001", "DTO", "TRANSPORT", "9876543212", "N/A", "officer@eroute.com", "password123", "officer"),
                    new User("Conductor Thomas", "CON001", "TS", "BUS", "9876543213", "Route 101", "conductor@eroute.com", "password123", "conductor")
                };

                for (User u : defaults) {
                    long id = db.appDao().insertUser(u);
                    u.setId((int)id);
                    mDatabase.child("users").child(u.getEmail().replace(".", ",")).setValue(u);
                }
            }
        });

        String selectedRole = getIntent().getStringExtra("selected_role");
        if (selectedRole == null) selectedRole = "student";

        TextView tvRoleBadge = findViewById(R.id.tvRoleBadge);
        EditText etEmail = findViewById(R.id.etEmail);
        EditText etPassword = findViewById(R.id.etPassword);

        switch (selectedRole) {
            case "admin":
                tvRoleBadge.setText(R.string.gateway_admin);
                etEmail.setText(R.string.email_admin);
                etPassword.setText(R.string.pass_default);
                break;
            case "officer":
                tvRoleBadge.setText(R.string.gateway_officer);
                etEmail.setText(R.string.email_officer);
                etPassword.setText(R.string.pass_default);
                break;
            case "conductor":
                tvRoleBadge.setText(R.string.gateway_conductor);
                etEmail.setText(R.string.email_conductor);
                etPassword.setText(R.string.pass_default);
                break;
            default:
                tvRoleBadge.setText(R.string.gateway_student);
                etEmail.setText(R.string.email_student);
                etPassword.setText(R.string.pass_default);
                break;
        }

        findViewById(R.id.btnExit).setOnClickListener(v -> finish());

        findViewById(R.id.btnTabRegister).setOnClickListener(v -> {
            Intent intent = new Intent(LoginActivity.this, RegisterActivity.class);
            intent.putExtra("selected_role", getIntent().getStringExtra("selected_role"));
            startActivity(intent);
            finish();
            overridePendingTransition(0, 0);
        });

        findViewById(R.id.btnTabForgot).setOnClickListener(v -> {
            Intent intent = new Intent(LoginActivity.this, ForgotPasswordActivity.class);
            intent.putExtra("selected_role", getIntent().getStringExtra("selected_role"));
            startActivity(intent);
            finish();
            overridePendingTransition(0, 0);
        });

        final String role = selectedRole;
        findViewById(R.id.btnLogin).setOnClickListener(v -> {
            String email = etEmail.getText().toString().trim();
            String password = etPassword.getText().toString().trim();

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please enter credentials", Toast.LENGTH_SHORT).show();
                return;
            }

            executorService.execute(() -> {
                AppDatabase db = AppDatabase.getInstance(getApplicationContext());
                User user = db.appDao().login(email, password);
                runOnUiThread(() -> {
                    if (user != null) {
                        // Save session
                        android.content.SharedPreferences prefs = getSharedPreferences("EroutePrefs", MODE_PRIVATE);
                        prefs.edit()
                            .putBoolean("is_logged_in", true)
                            .putInt("user_id", user.getId())
                            .putString("user_name", user.getFullName())
                            .putString("user_role", user.getRole())
                            .apply();

                        Intent intent;
                        if (user.getRole().equalsIgnoreCase("admin")) {
                            intent = new Intent(LoginActivity.this, AdminDashboardActivity.class);
                        } else if (user.getRole().equalsIgnoreCase("officer")) {
                            intent = new Intent(LoginActivity.this, OfficerDashboardActivity.class);
                        } else if (user.getRole().equalsIgnoreCase("conductor")) {
                            intent = new Intent(LoginActivity.this, ConductorDashboardActivity.class);
                        } else {
                            intent = new Intent(LoginActivity.this, StudentDashboardActivity.class);
                        }
                        intent.putExtra("user_id", user.getId());
                        intent.putExtra("user_name", user.getFullName());
                        intent.putExtra("user_role", user.getRole().toUpperCase() + " HUB");
                        startActivity(intent);
                        finish();
                    } else {
                        Toast.makeText(this, "Invalid email or password", Toast.LENGTH_SHORT).show();
                    }
                });
            });
        });
    }
}
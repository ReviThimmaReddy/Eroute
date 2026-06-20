package com.simats.eroute;

import android.content.Intent;
import android.os.Bundle;
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

public class
RegisterActivity extends AppCompatActivity {
    private ExecutorService executorService = Executors.newSingleThreadExecutor();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_register);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(android.R.id.content), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        String selectedRole = getIntent().getStringExtra("selected_role");
        if (selectedRole == null) selectedRole = "student";

        final String role = selectedRole;
        TextView tvRoleBadge = findViewById(R.id.tvRoleBadge);
        
        switch (role) {
            case "admin":
                tvRoleBadge.setText(R.string.gateway_admin);
                break;
            case "officer":
                tvRoleBadge.setText(R.string.gateway_officer);
                break;
            case "conductor":
                tvRoleBadge.setText(R.string.gateway_conductor);
                break;
            default:
                tvRoleBadge.setText(R.string.gateway_student);
                break;
        }

        findViewById(R.id.btnExit).setOnClickListener(v -> finish());
        
        findViewById(R.id.btnTabLogin).setOnClickListener(v -> {
            Intent intent = new Intent(RegisterActivity.this, LoginActivity.class);
            intent.putExtra("selected_role", getIntent().getStringExtra("selected_role"));
            startActivity(intent);
            finish();
            overridePendingTransition(0, 0);
        });

        findViewById(R.id.btnTabForgot).setOnClickListener(v -> {
            Intent intent = new Intent(RegisterActivity.this, ForgotPasswordActivity.class);
            intent.putExtra("selected_role", getIntent().getStringExtra("selected_role"));
            startActivity(intent);
            finish();
            overridePendingTransition(0, 0);
        });

        EditText etFullName = findViewById(R.id.etFullName);
        EditText etRegNo = findViewById(R.id.etRegNo);
        EditText etCollegeCode = findViewById(R.id.etCollegeCode);
        EditText etDepartment = findViewById(R.id.etDepartment);
        EditText etMobile = findViewById(R.id.etMobile);
        EditText etRoute = findViewById(R.id.etRoute);
        EditText etEmail = findViewById(R.id.etEmail);
        EditText etPassword = findViewById(R.id.etPassword);

        findViewById(R.id.btnRegister).setOnClickListener(v -> {
            String fullName = etFullName.getText().toString().trim();
            String regNo = etRegNo.getText().toString().trim();
            String collegeCode = etCollegeCode.getText().toString().trim();
            String dept = etDepartment.getText().toString().trim();
            String mobile = etMobile.getText().toString().trim();
            String route = etRoute.getText().toString().trim();
            String email = etEmail.getText().toString().trim();
            String password = etPassword.getText().toString().trim();

            if (fullName.isEmpty() || email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill required fields", Toast.LENGTH_SHORT).show();
                return;
            }

            User user = new User(fullName, regNo, collegeCode, dept, mobile, route, email, password, role);
            
            executorService.execute(() -> {
                AppDatabase db = AppDatabase.getInstance(getApplicationContext());
                long userId = db.appDao().insertUser(user);
                user.setId((int)userId);

                // Firebase Sync
                DatabaseReference mDatabase = FirebaseDatabase.getInstance("https://eroute-ed29d-default-rtdb.asia-southeast1.firebasedatabase.app/").getReference();
                String emailKey = email.replace(".", ",");
                mDatabase.child("users").child(emailKey).setValue(user);

                if (role.equalsIgnoreCase("student")) {
                    com.simats.eroute.database.BusPass pass = new com.simats.eroute.database.BusPass((int)userId, "Submitted", "10/11/2024", route);
                    db.appDao().insertBusPass(pass);
                    mDatabase.child("bus_passes").child(String.valueOf(userId)).setValue(pass);
                }

                runOnUiThread(() -> {
                    Toast.makeText(this, "Registration successful", Toast.LENGTH_SHORT).show();
                    Intent intent = new Intent(RegisterActivity.this, LoginActivity.class);
                    intent.putExtra("selected_role", role);
                    startActivity(intent);
                    finish();
                });
            });
        });
    }
}
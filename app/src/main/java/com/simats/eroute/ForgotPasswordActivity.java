package com.simats.eroute;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class ForgotPasswordActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_forgot_password);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(android.R.id.content), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        String selectedRole = getIntent().getStringExtra("selected_role");
        if (selectedRole == null) selectedRole = "student";

        TextView tvRoleBadge = findViewById(R.id.tvRoleBadge);
        
        switch (selectedRole) {
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
            Intent intent = new Intent(ForgotPasswordActivity.this, LoginActivity.class);
            intent.putExtra("selected_role", getIntent().getStringExtra("selected_role"));
            startActivity(intent);
            finish();
            overridePendingTransition(0, 0);
        });

        findViewById(R.id.btnTabRegister).setOnClickListener(v -> {
            Intent intent = new Intent(ForgotPasswordActivity.this, RegisterActivity.class);
            intent.putExtra("selected_role", getIntent().getStringExtra("selected_role"));
            startActivity(intent);
            finish();
            overridePendingTransition(0, 0);
        });

        findViewById(R.id.btnDispatch).setOnClickListener(v -> {
            android.widget.EditText etEmail = findViewById(R.id.etEmail);
            String email = etEmail.getText().toString().trim();
            if (email.isEmpty()) {
                android.widget.Toast.makeText(this, "Please enter your registered email", android.widget.Toast.LENGTH_SHORT).show();
                return;
            }
            android.widget.Toast.makeText(this, "Recovery dispatch successful. Check your email.", android.widget.Toast.LENGTH_SHORT).show();
        });
    }
}
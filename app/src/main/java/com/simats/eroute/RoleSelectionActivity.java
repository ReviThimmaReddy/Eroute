package com.simats.eroute;

import android.content.Intent;
import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class RoleSelectionActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_role_selection);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(android.R.id.content), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        findViewById(R.id.btnRoleStudent).setOnClickListener(v -> navigateToLogin("student"));
        findViewById(R.id.btnRoleAdmin).setOnClickListener(v -> {
            Intent intent = new Intent(RoleSelectionActivity.this, AdminAuthActivity.class);
            startActivity(intent);
        });
        findViewById(R.id.btnRoleOfficer).setOnClickListener(v -> {
            Intent intent = new Intent(RoleSelectionActivity.this, OfficerAuthActivity.class);
            startActivity(intent);
        });
        findViewById(R.id.btnRoleConductor).setOnClickListener(v -> {
            Intent intent = new Intent(RoleSelectionActivity.this, ConductorAuthActivity.class);
            startActivity(intent);
        });

        findViewById(R.id.btnRestart).setOnClickListener(v -> {
            android.content.SharedPreferences prefs = getSharedPreferences("EroutePrefs", MODE_PRIVATE);
            prefs.edit().putBoolean("is_first_time", true).apply();

            Intent intent = new Intent(RoleSelectionActivity.this, IntroActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
        });

        findViewById(R.id.btnPhpExport).setOnClickListener(v -> {
            android.widget.Toast.makeText(this, "Exporting database to PHP format...", android.widget.Toast.LENGTH_SHORT).show();
        });
    }

    private void navigateToLogin(String role) {
        Intent intent = new Intent(RoleSelectionActivity.this, LoginActivity.class);
        intent.putExtra("selected_role", role);
        startActivity(intent);
    }
}
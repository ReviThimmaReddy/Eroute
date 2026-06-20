package com.simats.eroute;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Transition logic after 2 seconds
        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                android.content.SharedPreferences prefs = getSharedPreferences("EroutePrefs", MODE_PRIVATE);
                boolean isFirstTime = prefs.getBoolean("is_first_time", true);
                boolean isLoggedIn = prefs.getBoolean("is_logged_in", false);

                Intent intent;
                if (isFirstTime) {
                    intent = new Intent(MainActivity.this, IntroActivity.class);
                } else if (isLoggedIn) {
                    String role = prefs.getString("user_role", "student");
                    if ("admin".equalsIgnoreCase(role)) {
                        intent = new Intent(MainActivity.this, AdminDashboardActivity.class);
                    } else if ("officer".equalsIgnoreCase(role)) {
                        intent = new Intent(MainActivity.this, OfficerDashboardActivity.class);
                    } else if ("conductor".equalsIgnoreCase(role)) {
                        intent = new Intent(MainActivity.this, ConductorDashboardActivity.class);
                    } else {
                        intent = new Intent(MainActivity.this, StudentDashboardActivity.class);
                    }
                    intent.putExtra("user_id", prefs.getInt("user_id", -1));
                    intent.putExtra("user_name", prefs.getString("user_name", "User"));
                    intent.putExtra("user_role", role.toUpperCase() + " HUB");
                } else {
                    intent = new Intent(MainActivity.this, RoleSelectionActivity.class);
                }

                startActivity(intent);
                finish();
            }
        }, 2000);
    }
}
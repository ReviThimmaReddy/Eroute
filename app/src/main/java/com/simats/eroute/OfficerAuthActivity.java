package com.simats.eroute;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class OfficerAuthActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_officer_auth);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(android.R.id.content), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        findViewById(R.id.btnExit).setOnClickListener(v -> finish());
        
        findViewById(R.id.btnAuthenticate).setOnClickListener(v -> {
            String email = "officer@eroute.com";
            String password = "password123";

            new Thread(() -> {
                com.simats.eroute.database.AppDatabase db = com.simats.eroute.database.AppDatabase.getInstance(getApplicationContext());
                com.simats.eroute.database.User user = db.appDao().login(email, password);
                
                runOnUiThread(() -> {
                    if (user != null) {
                        android.content.SharedPreferences prefs = getSharedPreferences("EroutePrefs", MODE_PRIVATE);
                        prefs.edit()
                            .putBoolean("is_logged_in", true)
                            .putInt("user_id", user.getId())
                            .putString("user_name", user.getFullName())
                            .putString("user_role", user.getRole())
                            .apply();

                        android.content.Intent intent = new android.content.Intent(OfficerAuthActivity.this, OfficerDashboardActivity.class);
                        intent.putExtra("user_id", user.getId());
                        intent.putExtra("user_name", user.getFullName());
                        intent.putExtra("user_role", user.getRole().toUpperCase() + " HUB");
                        startActivity(intent);
                        finish();
                    } else {
                        android.widget.Toast.makeText(this, "Officer credentials not found. Please log in once via Student gateway to initialize.", android.widget.Toast.LENGTH_LONG).show();
                    }
                });
            }).start();
        });
    }
}
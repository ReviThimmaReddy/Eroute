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
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class ApplyPassActivity extends AppCompatActivity {
    private ExecutorService executorService = Executors.newSingleThreadExecutor();
    private User currentUser;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_apply_pass);
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
                            TextView tvApplyTitle = findViewById(R.id.tvApplyTitle);
                            TextView tvApplyDesc = findViewById(R.id.tvApplyDesc);
                            if (tvApplyTitle != null) tvApplyTitle.setText("Status: " + pass.getStatus());
                            if (tvApplyDesc != null) tvApplyDesc.setText("Your application for " + pass.getRoute() + " is " + pass.getStatus().toLowerCase() + ".");
                            findViewById(R.id.btnSubmitManual).setVisibility(android.view.View.GONE);
                        } else {
                            TextView tvApplyTitle = findViewById(R.id.tvApplyTitle);
                            TextView tvApplyDesc = findViewById(R.id.tvApplyDesc);
                            if (tvApplyTitle != null) tvApplyTitle.setText("No Active Application");
                            if (tvApplyDesc != null) tvApplyDesc.setText("You haven't applied for a bus pass yet.");
                            findViewById(R.id.btnSubmitManual).setVisibility(android.view.View.VISIBLE);
                        }
                    }
                });
            });
        } else if (userName != null) {
            ((TextView) findViewById(R.id.profileInitial)).setText(userName.substring(0, 2).toUpperCase());
        }

        findViewById(R.id.btnSubmitManual).setOnClickListener(v -> {
            if (currentUser != null) {
                executorService.execute(() -> {
                    AppDatabase db = AppDatabase.getInstance(getApplicationContext());
                    com.simats.eroute.database.BusPass newPass = new com.simats.eroute.database.BusPass(currentUser.getId(), "Submitted", "12/11/2024", currentUser.getTransitRoute());
                    db.appDao().insertBusPass(newPass);
                    
                    // Firebase Sync
                    DatabaseReference mDatabase = FirebaseDatabase.getInstance("https://eroute-ed29d-default-rtdb.asia-southeast1.firebasedatabase.app/").getReference();
                    mDatabase.child("bus_passes").child(String.valueOf(currentUser.getId())).setValue(newPass);

                    runOnUiThread(() -> {
                        android.widget.Toast.makeText(this, "Application submitted manually!", android.widget.Toast.LENGTH_SHORT).show();
                        recreate();
                    });
                });
            }
        });

        findViewById(R.id.btnLogout).setOnClickListener(v -> {
            Intent intent = new Intent(ApplyPassActivity.this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
        });

        findViewById(R.id.menuDashboard).setOnClickListener(v -> {
            Intent intent = new Intent(ApplyPassActivity.this, StudentDashboardActivity.class);
            passUserData(intent);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.menuDigitalPass).setOnClickListener(v -> {
            Intent intent = new Intent(ApplyPassActivity.this, DigitalPassActivity.class);
            passUserData(intent);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.menuNotifications).setOnClickListener(v -> {
            Intent intent = new Intent(ApplyPassActivity.this, NotificationsActivity.class);
            passUserData(intent);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.menuProfile).setOnClickListener(v -> {
            Intent intent = new Intent(ApplyPassActivity.this, ProfileActivity.class);
            passUserData(intent);
            startActivity(intent);
            finish();
        });

        findViewById(R.id.menuInspector).setOnClickListener(v -> {
            Intent intent = new Intent(ApplyPassActivity.this, DbInspectorActivity.class);
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
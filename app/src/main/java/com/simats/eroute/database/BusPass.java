package com.simats.eroute.database;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "bus_passes")
public class BusPass {
    @PrimaryKey(autoGenerate = true)
    private int id;
    private int userId;
    private String status;
    private String appliedDate;
    private String route;

    public BusPass() {}

    public BusPass(int userId, String status, String appliedDate, String route) {
        this.userId = userId;
        this.status = status;
        this.appliedDate = appliedDate;
        this.route = route;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAppliedDate() { return appliedDate; }
    public void setAppliedDate(String appliedDate) { this.appliedDate = appliedDate; }
    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }
}
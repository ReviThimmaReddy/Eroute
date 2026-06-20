package com.simats.eroute.database;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "users")
public class User {
    @PrimaryKey(autoGenerate = true)
    private int id;
    private String fullName;
    private String registerNumber;
    private String collegeCode;
    private String department;
    private String mobile;
    private String transitRoute;
    private String email;
    private String password;
    private String role;

    public User() {}

    public User(String fullName, String registerNumber, String collegeCode, String department, String mobile, String transitRoute, String email, String password, String role) {
        this.fullName = fullName;
        this.registerNumber = registerNumber;
        this.collegeCode = collegeCode;
        this.department = department;
        this.mobile = mobile;
        this.transitRoute = transitRoute;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRegisterNumber() { return registerNumber; }
    public void setRegisterNumber(String registerNumber) { this.registerNumber = registerNumber; }

    public String getCollegeCode() { return collegeCode; }
    public void setCollegeCode(String collegeCode) { this.collegeCode = collegeCode; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getTransitRoute() { return transitRoute; }
    public void setTransitRoute(String transitRoute) { this.transitRoute = transitRoute; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
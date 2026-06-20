package com.simats.eroute.database;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;
import java.util.List;

@Dao
public interface AppDao {
    @Insert
    long insertUser(User user);

    @Update
    void updateUser(User user);

    @Delete
    void deleteUser(User user);

    @Query("SELECT * FROM users WHERE email = :email AND password = :password LIMIT 1")
    User login(String email, String password);

    @Query("SELECT * FROM users WHERE id = :id")
    User getUserById(int id);

    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    User getUserByEmail(String email);

    @Insert
    void insertBusPass(BusPass busPass);

    @Query("SELECT * FROM bus_passes WHERE userId = :userId")
    List<BusPass> getBusPassesForUser(int userId);

    @Query("SELECT * FROM bus_passes")
    List<BusPass> getAllBusPasses();
    
    @Update
    void updateBusPass(BusPass busPass);

    @Query("SELECT COUNT(*) FROM users WHERE role = :role")
    int getUserCountByRole(String role);

    @Query("SELECT * FROM users")
    List<User> getAllUsers();

    @Query("UPDATE users SET password = :newPassword WHERE id = :userId")
    void updatePassword(int userId, String newPassword);
}
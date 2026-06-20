# eRoute Comprehensive Test Suite (100+ Test Cases)

## 1. UI/UX Testing (25 Cases)
1. Verify Splash Screen logo visibility.
2. Verify "eRoute" brand name font style and color (eroute_blue).
3. Verify "Intelligent Student Mobility Ecosystem" slogan visibility.
4. Verify Intro screen transition animations.
5. Verify indicator dots color change during onboarding.
6. Verify "Next" button responsiveness on all Intro screens.
7. Verify "Back" button functionality on Intro 2, 3, and 4.
8. Verify Role Selection card hover/click state highlights.
9. Verify icon colors in Role Selection (Blue, Green, Purple, Orange).
10. Verify Login screen badge color matches selected role.
11. Verify Student Dashboard header gradient consistency.
12. Verify Bottom Navigation icons alignment.
13. Verify profile initials generation (e.g., "Revi Thimma" -> "RE").
14. Verify dark mode background (`#0F172A`) consistency.
15. Verify button text capitalization consistency.
16. Verify input field focus borders.
17. Verify Toast message visibility and duration.
18. Verify QR code display clarity in Digital Pass.
19. Verify status pill colors (Verified = Green, Pending = Orange).
20. Verify ScrollView behavior on long forms (Registration).
21. Verify "Enter Control Room" arrow icon alignment.
22. Verify login exit button placement.
23. Verify system guard card transparency.
24. Verify UTC time display format.
25. Verify profile icon shape (rounded).

## 2. Functional Testing (40 Cases)
26. User Registration: Successful student account creation.
27. User Registration: Duplicate email prevention.
28. User Registration: Mandatory field validation.
29. Student Login: Successful authentication.
30. Admin Login: Successful authentication via AdminAuthActivity.
31. Officer Login: Successful authentication via OfficerAuthActivity.
32. Conductor Login: Successful authentication via ConductorAuthActivity.
33. Dashboard: Role-based dashboard redirection.
34. Logout: Clearing session/SharedPrefs and returning to Login.
35. Bus Pass Application: Submission of details.
36. Bus Pass Application: Automatic status set to "Submitted".
37. Admin Dashboard: Displaying total active students count.
38. Admin Dashboard: Simulate Applicant button functionality.
39. Officer Dashboard: Displaying approved applications ledger.
40. Officer Dashboard: Generate Bypass Permit functionality.
41. Conductor Dashboard: Load Preset data for scanning simulation.
42. Conductor Dashboard: Manual Signature Verification.
43. Digital Pass: Displaying "Issued" pass only after officer approval.
44. Profile: Password update in Room Database.
45. Profile: Password update in Firebase Realtime Database.
46. Database Sync: Pulling latest status from Firebase.
47. DB Inspector: Displaying local Room tables correctly.
48. DB Inspector: Refresh table button functionality.
49. Notifications: Displaying welcome notification.
50. Notifications: Displaying maintenance alert.
51. Forgot Password: Simulation of recovery link dispatch.
52. Role Selection: Restart Tour resets "is_first_time" flag.
53. PHP Export: Simulation of SQL ledger export.
54. Payment: Simulation of UPI payment submission.
55. Payment: Verification that payment updates "applications" ledger.
56. Student Hub: Sync button updates local pass status.
57. Admin Hub: Document preview simulation.
58. Officer Hub: Issuing digipass keykeys.
59. Conductor Hub: QR scan outcome display.
60. Main Activity: Redirection of logged-in user on app restart.
61. Session Management: "is_logged_in" persistency.
62. App Bar: Title change based on active fragment/activity.
63. Empty State: "No Valid Digipass Issued" message.
64. Error Handling: "Invalid email or password" toast.
65. Edge-to-Edge: Padding adjustment for system bars.

## 3. Unit & Validation Testing (20 Cases)
66. User Class: Getter/Setter for `fullName`.
67. User Class: Getter/Setter for `email`.
68. User Class: Constructor initialization.
69. AppDao: `insertUser` returns valid ID.
70. AppDao: `login` returns correct user for valid credentials.
71. AppDao: `getUserByEmail` returns null for non-existent user.
72. AppDao: `updatePassword` correctly modifies database record.
73. AppDao: `getUserCountByRole` accuracy.
74. BusPass Class: Foreign key relationship with User.
75. Email Validation: Rejection of invalid formats (e.g., "test@com").
76. Password Validation: Minimum character length check.
77. Register Number Validation: REGXXXX format check.
78. Transit Route Validation: Empty route selection prevention.
79. Firebase Sync: Handling network unavailability.
80. Room Migration: Schema version consistency.
81. SharedPreferences: `user_id` storage integrity.
82. Intent Extra: Passing user data between Activities.
83. Activity Lifecycle: State preservation on rotation.
84. Null Pointer: Handling missing extras in Dashboards.
85. Resource Access: `R.string` localization integrity.

## 4. Performance & Deployable Status (15 Cases)
86. App Launch Time: Under 3 seconds including Splash.
87. Database Query Latency: Under 100ms for user login.
88. Firebase Write Latency: Under 500ms on stable network.
89. Memory Usage: No significant leaks during dashboard navigation.
90. Build Success: Gradle assembleDebug completion.
91. APK Size: Optimization check (ProGuard).
92. Permission Check: Camera access for Conductor scanner.
93. Network Check: Graceful degradation for offline mode.
94. ProGuard Rules: Obfuscation of database entities.
95. Dependency Version: Check for latest stable libraries.
96. Android Version Compatibility: Testing on API 24 to 34.
97. UI Frame Rate: Smooth scrolling in ScrollView.
98. Background Threading: Database operations on non-UI thread.
99. APK Signature: V2/V3 signing verification.
100. Deployable Status: Ready for staging.
101. XAMPP Port: 3306 connectivity simulation.
102. AES-256: Encryption handshake key simulation.

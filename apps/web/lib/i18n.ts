export type Language = "en" | "vi";

export const languageLabels: Record<Language, string> = {
  en: "EN",
  vi: "VN"
};

export type MessageSchema = {
  common: {
    logout: string;
    loading: string;
    save: string;
    cancel: string;
  };
  adminSidebar: {
    brand: string;
    title: string;
    backToUser: string;
    overview: string;
    users: string;
    content: string;
    exercises: string;
    aiInsights: string;
    reports: string;
    announcements: string;
    activity: string;
    settings: string;
  };
  adminLogin: {
    title: string;
    subtitle: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    signIn: string;
    signingIn: string;
    continueGoogle: string;
    forgotPassword: string;
    needUserAccess: string;
    goUserLogin: string;
    modules: {
      workout: string;
      sport: string;
      learning: string;
      health: string;
      time: string;
    };
    controlTitle: string;
    controlSubtitle: string;
  };
  adminOverview: {
    badge: string;
    title: string;
    subtitle: string;
    mode: string;
    summaryCards: string[];
    connectHint: string;
    trendTitle: string;
    trendState: string;
    noChart: string;
    noChartHint: string;
    modulesTitle: string;
    modules: string[];
    publishedAnnouncements: string;
    activeUsers: string;
    totalUsers: string;
    thisWeek: string;
    lastWeek: string;
    workoutSeries: string;
    mealSeries: string;
    workoutsVsLastWeek: string;
    errorPrefix: string;
    filters: {
      days7: string;
      days30: string;
      days90: string;
    };
    distributionTitle: string;
    topUsersTitle: string;
    noTopUsers: string;
    workoutCount: string;
    modulesMap: {
      workouts: string;
      meals: string;
      activity: string;
      sleep: string;
      mood: string;
      goals: string;
      skills: string;
      finance: string;
    };
  };
  adminSettings: {
    title: string;
    subtitle: string;
    languageTitle: string;
    languageSubtitle: string;
    appearanceTitle: string;
    appearanceSubtitle: string;
    motionTitle: string;
    motionSubtitle: string;
    adminAccessTitle: string;
    adminAccessSubtitle: string;
    searchUserPlaceholder: string;
    promoteAdmin: string;
    revokeAdmin: string;
    currentAdmins: string;
    candidateUsers: string;
    noUsers: string;
    saveSuccess: string;
    saveFailed: string;
    generateDemoUsers: string;
    cleanupSeedData: string;
    toolRunning: string;
    demoCreateSuccess: string;
    demoCreateFailed: string;
    cleanupSuccess: string;
    cleanupFailed: string;
  };
  adminUsers: {
    title: string;
    subtitle: string;
    refresh: string;
    searchPlaceholder: string;
    totalUsers: string;
    admins: string;
    normalUsers: string;
    tableUser: string;
    tableRole: string;
    tableStatus: string;
    tableCreatedAt: string;
    tableAction: string;
    noContact: string;
    noData: string;
    save: string;
    saving: string;
    roleUser: string;
    roleAdmin: string;
    prev: string;
    next: string;
    page: string;
    updateSuccess: string;
    updateFailed: string;
    loadFailed: string;
    detail: string;
    ban: string;
    unban: string;
    statusActive: string;
    statusBanned: string;
    close: string;
    detailTitle: string;
    userId: string;
    contact: string;
    timezone: string;
    createdAt: string;
    bannedAt: string;
    noBanDate: string;
    activitySummary: string;
    workouts: string;
    meals: string;
    activities: string;
    sleepLogs: string;
    moodLogs: string;
    goals: string;
    detailLoadFailed: string;
    banSuccess: string;
    unbanSuccess: string;
    banFailed: string;
  };
};

export const messages: Record<Language, MessageSchema> = {
  en: {
    common: {
      logout: "Logout",
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel"
    },
    adminSidebar: {
      brand: "GunSelf Admin",
      title: "Command Deck",
      backToUser: "Back to User Dashboard",
      overview: "Overview",
      users: "Users",
      content: "Content",
      exercises: "Exercise Library",
      aiInsights: "AI Insights",
      reports: "Reports",
      announcements: "Announcements",
      activity: "Activity Monitor",
      settings: "Settings"
    },
    adminLogin: {
      title: "Admin Sign In",
      subtitle: "Secure access to users, reports, content, and platform operations.",
      emailPlaceholder: "admin@gunself.com",
      passwordPlaceholder: "Password",
      signIn: "Sign in as Admin",
      signingIn: "Signing in...",
      continueGoogle: "Continue with Google",
      forgotPassword: "Forgot admin password",
      needUserAccess: "Need user access?",
      goUserLogin: "Go to user login",
      modules: {
        workout: "Workout",
        sport: "Sport",
        learning: "Learning",
        health: "Health",
        time: "Time"
      },
      controlTitle: "Control The System",
      controlSubtitle: "Manage users, AI prompts, reports, announcements, and platform health."
    },
    adminOverview: {
      badge: "Overview",
      title: "GunSelf Admin Dashboard",
      subtitle: "Live platform metrics from Supabase.",
      mode: "Refresh",
      summaryCards: ["Total Users", "Active Users (7d)", "Workout Logs", "Meal Logs"],
      connectHint: "Live data",
      trendTitle: "Workout Activity (Last 7 Days)",
      trendState: "Live",
      noChart: "No chart data yet",
      noChartHint: "Add workout logs to render trend data.",
      modulesTitle: "Quick Snapshot",
      modules: [
        "User Management",
        "System Content",
        "Exercise Library",
        "AI Insights",
        "Reports",
        "Announcements",
        "Activity Monitor"
      ],
      publishedAnnouncements: "Published announcements",
      activeUsers: "Active users (7d)",
      totalUsers: "Total users",
      thisWeek: "This week",
      lastWeek: "Last week",
      workoutSeries: "Workout logs",
      mealSeries: "Meal logs",
      workoutsVsLastWeek: "Workout vs last week",
      errorPrefix: "Dashboard query failed",
      filters: {
        days7: "7D",
        days30: "30D",
        days90: "90D"
      },
      distributionTitle: "Module Distribution",
      topUsersTitle: "Top Active Users",
      noTopUsers: "No active users in this time window.",
      workoutCount: "workouts",
      modulesMap: {
        workouts: "Workouts",
        meals: "Meals",
        activity: "Activity",
        sleep: "Sleep",
        mood: "Mood",
        goals: "Goals",
        skills: "Skills",
        finance: "Finance"
      }
    },
    adminSettings: {
      title: "Admin Settings",
      subtitle: "Global controls for language, appearance, and admin workspace behavior.",
      languageTitle: "Language",
      languageSubtitle: "Choose default workspace language.",
      appearanceTitle: "Appearance",
      appearanceSubtitle: "Current admin palette: White / Red / Gray / Black.",
      motionTitle: "Motion",
      motionSubtitle: "3D cards and gentle animations are enabled.",
      adminAccessTitle: "Admin Access",
      adminAccessSubtitle: "Promote users to admin or revoke admin access.",
      searchUserPlaceholder: "Search by display name, email, or user ID...",
      promoteAdmin: "Make Admin",
      revokeAdmin: "Revoke Admin",
      currentAdmins: "Current Admins",
      candidateUsers: "Candidate Users",
      noUsers: "No users match this filter.",
      saveSuccess: "Admin role updated.",
      saveFailed: "Failed to update admin role.",
      generateDemoUsers: "Generate 5 Demo Users",
      cleanupSeedData: "Cleanup Seed Data",
      toolRunning: "Running...",
      demoCreateSuccess: "Demo users generated successfully.",
      demoCreateFailed: "Failed to generate demo users.",
      cleanupSuccess: "Seed data cleaned up successfully.",
      cleanupFailed: "Failed to clean up seed data."
    },
    adminUsers: {
      title: "User Management",
      subtitle: "Search users, review roles, and update access levels.",
      refresh: "Refresh",
      searchPlaceholder: "Search by display name or user ID...",
      totalUsers: "Total users",
      admins: "Admins",
      normalUsers: "Normal users",
      tableUser: "User",
      tableRole: "Role",
      tableStatus: "Status",
      tableCreatedAt: "Created at",
      tableAction: "Action",
      noContact: "No contact info",
      noData: "No users found.",
      save: "Save",
      saving: "Saving...",
      roleUser: "User",
      roleAdmin: "Admin",
      prev: "Prev",
      next: "Next",
      page: "Page",
      updateSuccess: "Role updated successfully.",
      updateFailed: "Failed to update role.",
      loadFailed: "Failed to load users."
      ,
      detail: "Detail",
      ban: "Ban",
      unban: "Unban",
      statusActive: "Active",
      statusBanned: "Banned",
      close: "Close",
      detailTitle: "User Detail",
      userId: "User ID",
      contact: "Contact",
      timezone: "Timezone",
      createdAt: "Created at",
      bannedAt: "Banned at",
      noBanDate: "Not banned",
      activitySummary: "Activity Summary",
      workouts: "Workouts",
      meals: "Meals",
      activities: "Activities",
      sleepLogs: "Sleep logs",
      moodLogs: "Mood logs",
      goals: "Goals",
      detailLoadFailed: "Failed to load detail.",
      banSuccess: "User has been banned.",
      unbanSuccess: "User has been unbanned.",
      banFailed: "Failed to update ban status."
    }
  },
  vi: {
    common: {
      logout: "Dang xuat",
      loading: "Dang tai...",
      save: "Luu",
      cancel: "Huy"
    },
    adminSidebar: {
      brand: "GunSelf Admin",
      title: "Bang Dieu Khien",
      backToUser: "Ve Dashboard Nguoi Dung",
      overview: "Tong Quan",
      users: "Nguoi Dung",
      content: "Noi Dung",
      exercises: "Thu Vien Bai Tap",
      aiInsights: "AI Insights",
      reports: "Bao Cao",
      announcements: "Thong Bao",
      activity: "Giam Sat Hoat Dong",
      settings: "Cai Dat"
    },
    adminLogin: {
      title: "Dang Nhap Admin",
      subtitle: "Truy cap bao mat vao nguoi dung, bao cao, noi dung va van hanh he thong.",
      emailPlaceholder: "admin@gunself.com",
      passwordPlaceholder: "Mat khau",
      signIn: "Dang nhap Admin",
      signingIn: "Dang dang nhap...",
      continueGoogle: "Tiep tuc voi Google",
      forgotPassword: "Quen mat khau admin",
      needUserAccess: "Can quyen nguoi dung?",
      goUserLogin: "Qua dang nhap user",
      modules: {
        workout: "Tap Luyen",
        sport: "The Thao",
        learning: "Hoc Tap",
        health: "Suc Khoe",
        time: "Thoi Gian"
      },
      controlTitle: "Dieu Phoi He Thong",
      controlSubtitle: "Quan ly nguoi dung, prompt AI, bao cao, thong bao va suc khoe nen tang."
    },
    adminOverview: {
      badge: "Tong Quan",
      title: "Dashboard Quan Tri GunSelf",
      subtitle: "So lieu he thong dang cap nhat truc tiep tu Supabase.",
      mode: "Lam moi",
      summaryCards: ["Tong Nguoi Dung", "Nguoi Dung Hoat Dong (7 ngay)", "Nhat Ky Workout", "Nhat Ky Bua An"],
      connectHint: "Du lieu thuc",
      trendTitle: "Hoat Dong Workout (7 Ngay Gan Nhat)",
      trendState: "Truc tiep",
      noChart: "Chua co du lieu bieu do",
      noChartHint: "Them workout log de bieu do hien thi.",
      modulesTitle: "Thong Ke Nhanh",
      modules: [
        "Quan Ly Nguoi Dung",
        "Noi Dung He Thong",
        "Thu Vien Bai Tap",
        "AI Insights",
        "Bao Cao",
        "Thong Bao",
        "Giam Sat Hoat Dong"
      ],
      publishedAnnouncements: "Thong bao da dang",
      activeUsers: "Nguoi dung hoat dong (7 ngay)",
      totalUsers: "Tong nguoi dung",
      thisWeek: "Tuan nay",
      lastWeek: "Tuan truoc",
      workoutSeries: "Nhat ky workout",
      mealSeries: "Nhat ky bua an",
      workoutsVsLastWeek: "Workout so voi tuan truoc",
      errorPrefix: "Loi truy van dashboard",
      filters: {
        days7: "7N",
        days30: "30N",
        days90: "90N"
      },
      distributionTitle: "Phan Bo Module",
      topUsersTitle: "Nguoi Dung Hoat Dong Nhieu",
      noTopUsers: "Khong co nguoi dung hoat dong trong khoang nay.",
      workoutCount: "workout",
      modulesMap: {
        workouts: "Workout",
        meals: "Bua an",
        activity: "Hoat dong",
        sleep: "Giac ngu",
        mood: "Tam trang",
        goals: "Muc tieu",
        skills: "Ky nang",
        finance: "Tai chinh"
      }
    },
    adminSettings: {
      title: "Cai Dat Admin",
      subtitle: "Dieu khien ngon ngu, giao dien va hanh vi workspace quan tri.",
      languageTitle: "Ngon Ngu",
      languageSubtitle: "Chon ngon ngu mac dinh cho workspace.",
      appearanceTitle: "Giao Dien",
      appearanceSubtitle: "Tone admin hien tai: Trang / Do / Xam / Den.",
      motionTitle: "Chuyen Dong",
      motionSubtitle: "Dang bat the 3D va animation nhe.",
      adminAccessTitle: "Quyen Admin",
      adminAccessSubtitle: "Cap quyen admin cho user hoac thu hoi quyen admin.",
      searchUserPlaceholder: "Tim theo ten, email hoac user ID...",
      promoteAdmin: "Cap Admin",
      revokeAdmin: "Thu hoi Admin",
      currentAdmins: "Danh Sach Admin",
      candidateUsers: "Nguoi Dung De Cap Quyen",
      noUsers: "Khong co user phu hop.",
      saveSuccess: "Cap nhat quyen admin thanh cong.",
      saveFailed: "Cap nhat quyen admin that bai.",
      generateDemoUsers: "Tao 5 Demo Users",
      cleanupSeedData: "Don Du Lieu Seed",
      toolRunning: "Dang chay...",
      demoCreateSuccess: "Da tao demo users thanh cong.",
      demoCreateFailed: "Tao demo users that bai.",
      cleanupSuccess: "Da don du lieu seed thanh cong.",
      cleanupFailed: "Don du lieu seed that bai."
    },
    adminUsers: {
      title: "Quan Ly Nguoi Dung",
      subtitle: "Tim kiem nguoi dung, xem role va cap nhat quyen truy cap.",
      refresh: "Lam moi",
      searchPlaceholder: "Tim theo ten hien thi hoac user ID...",
      totalUsers: "Tong nguoi dung",
      admins: "Admin",
      normalUsers: "Nguoi dung thuong",
      tableUser: "Nguoi dung",
      tableRole: "Role",
      tableStatus: "Trang thai",
      tableCreatedAt: "Ngay tao",
      tableAction: "Hanh dong",
      noContact: "Chua co thong tin lien he",
      noData: "Khong tim thay nguoi dung.",
      save: "Luu",
      saving: "Dang luu...",
      roleUser: "User",
      roleAdmin: "Admin",
      prev: "Truoc",
      next: "Sau",
      page: "Trang",
      updateSuccess: "Cap nhat role thanh cong.",
      updateFailed: "Cap nhat role that bai.",
      loadFailed: "Tai danh sach nguoi dung that bai.",
      detail: "Chi tiet",
      ban: "Khoa",
      unban: "Mo khoa",
      statusActive: "Dang hoat dong",
      statusBanned: "Da khoa",
      close: "Dong",
      detailTitle: "Chi Tiet Nguoi Dung",
      userId: "User ID",
      contact: "Lien he",
      timezone: "Mui gio",
      createdAt: "Ngay tao",
      bannedAt: "Ngay khoa",
      noBanDate: "Chua bi khoa",
      activitySummary: "Tong Quan Hoat Dong",
      workouts: "Workout",
      meals: "Bua an",
      activities: "Hoat dong",
      sleepLogs: "Nhat ky ngu",
      moodLogs: "Nhat ky tam trang",
      goals: "Muc tieu",
      detailLoadFailed: "Tai chi tiet that bai.",
      banSuccess: "Da khoa nguoi dung.",
      unbanSuccess: "Da mo khoa nguoi dung.",
      banFailed: "Cap nhat trang thai khoa that bai."
    }
  }
};

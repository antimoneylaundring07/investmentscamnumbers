async function logActivityChange(columnName, newValue, rowId) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            console.warn('User not logged in, activity not logged');
            return;
        }

        // ✅ CAPTURE CURRENT TIME - This is the fix!
        const now = new Date();
        const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        const timestamp = istTime.toISOString().replace('Z', '+05:30');

        console.log('📝 Logging activity:', {
            columnName,
            newValue,
            rowId,
            timestamp,
            userEmail: currentUser.email
        });

        const { error } = await supabaseClient
            .from('activity_log')
            .insert([{
                user_email: currentUser.email,
                row_id: rowId,
                column_name: columnName,
                new_value: newValue,
                timestamp: timestamp  // ✅ Use captured current time
            }]);

        if (error) {
            console.error('Error logging activity:', error);
            throw error;
        }

        console.log('✅ Activity logged successfully');
    } catch (error) {
        console.error('❌ Failed to log activity:', error);
    }
}

async function getActivityLog(filters = {}) {
    try {
        let query = supabaseClient
            .from('activity_log')
            .select('*')
            .order('timestamp', { ascending: false });

        // Apply filters if provided
        if (filters.user_email) {
            query = query.eq('user_email', filters.user_email);
        }
        if (filters.column_name) {
            query = query.eq('column_name', filters.column_name);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('❌ Error fetching activity log:', error);
        throw error;
    }
}

async function getActivitySummary() {
    try {
        const activities = await getActivityLog();

        return {
            totalChanges: activities.length,
            uniqueUsers: new Set(activities.map(a => a.user_email)).size,
            changedColumns: new Set(activities.map(a => a.column_name)).size,
            activities: activities
        };
    } catch (error) {
        console.error('❌ Error getting activity summary:', error);
        return null;
    }
}

console.log('Activity Log script loaded successfully');
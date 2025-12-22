// Database operations and CRUD functions
async function loadData(tableName = TABLE_NAME) {
    try {
        const { data: fetchedData, error } = await supabaseClient
            .from(tableName)
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        // console.log('✅ Data fetched:', fetchedData);
        return fetchedData;
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

async function blockedData() {
    try {
        const { data: fetchedData, error } = await supabaseClient
            .from(BLOCKED_NUMBERS_TABLE)
            .select('*')
            .order('id', { ascending: true });;

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        // console.log('✅ Data fetched:', fetchedData);
        return fetchedData;
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

async function updateRowInDB(rowId, updatedData) {
    try {
        const { data: result, error } = await supabaseClient
            .from(TABLE_NAME)
            .update(updatedData)
            .eq('id', rowId)
            .select()
            .order('id', { ascending: true });

        if (error) {
            console.error('❌ Update error:', error);
            throw error;
        }

        return result;
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

async function deleteRowFromDB(rowId, tableName = TABLE_NAME) {
    try {
        const { error } = await supabaseClient
            .from(tableName)
            .delete()
            .eq('id', rowId);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error('❌ Delete error:', error);
        throw error;
    }
}

async function deleteMultipleBlockedRows(rowId) {
    try {
        const { error } = await supabaseClient
            .from(BLOCKED_NUMBERS_TABLE)
            .delete()
            .eq('id', rowId);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        console.error('❌ Delete error:', error);
        throw error;
    }
}

async function importCSVData(newRecords, tableName) {
    try {
        // const tableName = PLATFORM_TABLES[platform];

        if (!tableName) {
            throw new Error('Invalid platform selected');
        }

        const recordsWithId = newRecords.filter(r => r.id);
        const recordsWithoutId = newRecords.filter(r => !r.id);

        // 🔹 UPDATE records with id
        if (recordsWithId.length > 0) {
            for (const rec of recordsWithId) {
                const id = rec.id;
                delete rec.id;

                const { error } = await supabaseClient
                    .from(tableName)
                    .update(rec)
                    .eq('id', id);

                if (error) {
                    console.error(`Update error [${tableName}] id=${id}`, error);
                }
            }
        }

        // 🔹 INSERT records without id
        if (recordsWithoutId.length > 0) {
            const { error } = await supabaseClient
                .from(tableName)
                .insert(recordsWithoutId);

            if (error) {
                console.error(`Insert error [${tableName}]`, error);
                throw error;
            }
        }

        return true;

    } catch (error) {
        console.error('Import error:', error);
        throw error;
    }
}

// Move number to permanent blocked table
async function moveToBlockedNumbers(rowId) {
    try {
        // Map columns from numbers table to permanent_blocked_numbers table
        const { data: rowData, error: fetchError } = await supabaseClient
            .from(TABLE_NAME) // numbers
            .select('*')
            .eq('id', rowId)
            .single();

        if (fetchError || !rowData) {
            throw new Error('Failed to fetch row from numbers table');
        }

        console.log('DB row fetched for move:', rowData);
        const blockedRecord = {
            'Owned By': rowData['Owned By'],
            'Number': rowData['Number'],
            'Whatsapp Login Device': rowData['Whatsapp Login Device'],
            'Number Inserted Device': rowData['SIM Inserted Device'],
            'Sim Type': rowData['Sim Type'],
            'Permanent Blocked Date': rowData['Blocked Date'],
            'WA Acc Date': rowData['WA Acc Date'],
            'Sim Buy Date': rowData['SIM Buy Date'],
            'Sim Duration': rowData['No of Days'],
            'Sim Operator': rowData['Sim Operator'],
        };

        console.log('blockedRecord to insert:', blockedRecord);

        const { data: result, error } = await supabaseClient
            .from(BLOCKED_NUMBERS_TABLE)
            .insert([blockedRecord])
            .select();

        if (error) {
            console.error('❌ Error moving to blocked table:', error);
            throw error;
        }

        // 2) Delete from numbers table by id
        const { error: deleteError } = await supabaseClient
            .from(TABLE_NAME)                 // 'numbers'
            .delete()
            .eq('id', rowData.id);

        if (deleteError) {
            console.error('❌ Error deleting from numbers:', deleteError);
            throw deleteError;
        }

        console.log('✅ Record moved to permanent_blocked_numbers:', result);
        return result;
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

// Check if number already exists in permanent_blocked_numbers
async function isNumberAlreadyBlocked(phoneNumber) {
    try {
        const { data, error } = await supabaseClient
            .from(BLOCKED_NUMBERS_TABLE)
            .select('id')
            .eq('Number', phoneNumber)
            .single();

        if (error && error.code === 'PGRST116') {
            // No record found - this is expected
            return false;
        }

        if (error) {
            console.error('❌ Error checking blocked status:', error);
            throw error;
        }

        return data ? true : false;
    } catch (error) {
        console.error('❌ Error:', error);
        return false;
    }
}

// Update current status in database
async function updateBlockedStatusInDB(rowId, newStatus, columnName = 'Current Satus') {
    try {
        const { data, error } = await supabaseClient
            .from('permanent_blocked_number')
            .update({ [columnName]: newStatus })
            .eq('id', rowId);

        if (error) {
            console.error('DB Error:', error);
            return false;
        }

        console.log('✅ Updated in DB:', data);
        return true;

    } catch (err) {
        console.error('Error in updateBlockedStatusInDB:', err);
        throw err;
    }
}


console.log('Database script loaded successfully');
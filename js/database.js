// Database operations and CRUD functions
async function loadData() {
    try {
        const { data: fetchedData, error } = await supabaseClient
            .from(TABLE_NAME)
            .select('*');

        if (error) {
            console.error('❌ Supabase error:', error);
            throw error;
        }

        console.log('✅ Data fetched:', fetchedData);
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
            .select();

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

async function deleteRowFromDB(rowId) {
    try {
        const { error } = await supabaseClient
            .from(TABLE_NAME)
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

async function importCSVData(newRecords) {
    try {
        const recordsWithId = newRecords.filter(r => r.id);
        const recordsWithoutId = newRecords.filter(r => !r.id);

        if (recordsWithId.length > 0) {
            for (const rec of recordsWithId) {
                const id = rec.id;
                delete rec.id;

                const { error } = await supabaseClient
                    .from(TABLE_NAME)
                    .update(rec)
                    .eq('id', id);

                if (error) {
                    console.error('Update error for id', id, error);
                }
            }
        }

        if (recordsWithoutId.length > 0) {
            const { error } = await supabaseClient
                .from(TABLE_NAME)
                .insert(recordsWithoutId);

            if (error) {
                console.error('Insert error:', error);
                throw error;
            }
        }

        return true;
    } catch (error) {
        console.error('Import error:', error);
        throw error;
    }
}

console.log('Database script loaded successfully');
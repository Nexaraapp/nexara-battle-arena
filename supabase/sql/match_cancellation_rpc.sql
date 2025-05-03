
-- Function to cancel a match and process refunds
CREATE OR REPLACE FUNCTION public.cancel_match(match_id_param UUID, admin_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    match_record RECORD;
    entry_record RECORD;
    refunded_count INTEGER := 0;
BEGIN
    -- Get match data
    SELECT * INTO match_record FROM matches WHERE id = match_id_param;
    
    IF match_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'error', 'Match not found'
        );
    END IF;
    
    -- Update match status to cancelled
    UPDATE matches SET status = 'cancelled' WHERE id = match_id_param;
    
    -- Process refunds for each participant
    FOR entry_record IN SELECT * FROM match_entries WHERE match_id = match_id_param AND paid = TRUE
    LOOP
        -- Add refund transaction
        INSERT INTO transactions (
            user_id, 
            amount, 
            type, 
            status, 
            date, 
            match_id, 
            admin_id, 
            notes
        ) VALUES (
            entry_record.user_id,
            match_record.entry_fee,
            'refund',
            'completed',
            CURRENT_DATE,
            match_id_param,
            admin_id_param,
            'Refund for cancelled match ' || match_record.type
        );
        
        -- Add notification for the user
        INSERT INTO notifications (
            user_id,
            message
        ) VALUES (
            entry_record.user_id,
            'Your match has been cancelled and your entry fee of ' || match_record.entry_fee || ' coins has been refunded.'
        );
        
        refunded_count := refunded_count + 1;
    END LOOP;
    
    -- Log the admin action
    INSERT INTO system_logs (
        admin_id,
        action,
        details
    ) VALUES (
        admin_id_param,
        'Match Cancelled',
        'Cancelled match ' || match_id_param || ' and refunded ' || refunded_count || ' participants'
    );
    
    RETURN jsonb_build_object(
        'success', TRUE,
        'refunded_users', refunded_count
    );
END;
$$;

-- Grant execution permission to authenticated users
REVOKE ALL ON FUNCTION public.cancel_match(UUID, UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.cancel_match(UUID, UUID) TO authenticated;

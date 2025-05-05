// PlayFab API client
// This is a simplified client for PlayFab API integration

// Replace these with your actual PlayFab values
const PLAYFAB_TITLE_ID = "192CC5"; // From your PlayFab account
const PLAYFAB_API_BASE = `https://${PLAYFAB_TITLE_ID}.playfabapi.com`;

interface PlayFabRequest {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean;
}

interface PlayFabResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class PlayFabClient {
  private static sessionToken: string | null = null;
  private static titleId: string = PLAYFAB_TITLE_ID;

  /**
   * Set the player's session token after login
   */
  static setSessionToken(token: string) {
    this.sessionToken = token;
    // Store in localStorage to persist across page reloads
    localStorage.setItem('playfab_session_token', token);
  }

  /**
   * Get the stored session token
   */
  static getSessionToken(): string | null {
    if (!this.sessionToken) {
      // Try to load from localStorage
      this.sessionToken = localStorage.getItem('playfab_session_token');
    }
    return this.sessionToken;
  }

  /**
   * Clear the session token (logout)
   */
  static clearSessionToken() {
    this.sessionToken = null;
    localStorage.removeItem('playfab_session_token');
  }

  /**
   * Make a request to the PlayFab API
   */
  static async request<T = any>({
    endpoint,
    method = 'POST',
    body,
    headers = {},
    auth = true
  }: PlayFabRequest): Promise<PlayFabResponse<T>> {
    try {
      const url = `${PLAYFAB_API_BASE}${endpoint}`;
      
      // Set up headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers
      };

      // Add authentication if required and available
      if (auth && this.sessionToken) {
        requestHeaders['X-Authorization'] = this.sessionToken;
      }

      // Make the request
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined
      });

      // Parse response
      const data = await response.json();

      // Check for PlayFab error format
      if (data.error || data.errorMessage) {
        return {
          success: false,
          error: data.errorMessage || 'Unknown PlayFab error'
        };
      }

      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      console.error('PlayFab API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Login with PlayFab using username/email and password
   */
  static async loginWithEmailAddress(email: string, password: string): Promise<PlayFabResponse> {
    const response = await this.request({
      endpoint: '/Client/LoginWithEmailAddress',
      body: {
        TitleId: this.titleId,
        Email: email,
        Password: password
      },
      auth: false
    });

    if (response.success && response.data?.SessionTicket) {
      this.setSessionToken(response.data.SessionTicket);
    }

    return response;
  }

  /**
   * Join a matchmaking queue
   */
  static async joinMatchmakingQueue(
    queueName: string,
    playerAttributes: any = {}
  ): Promise<PlayFabResponse> {
    return this.request({
      endpoint: '/Client/MatchmakePlayer',
      body: {
        QueueName: queueName,
        PlayerAttributes: playerAttributes
      }
    });
  }

  /**
   * Cancel an active matchmaking ticket
   */
  static async cancelMatchmaking(ticketId: string): Promise<PlayFabResponse> {
    return this.request({
      endpoint: '/Client/CancelMatchmakingTicket',
      body: {
        QueueName: "battle_royale_26_50", // Default queue, can be parameterized
        TicketId: ticketId
      }
    });
  }

  /**
   * Check matchmaking status
   */
  static async checkMatchmakingStatus(ticketId: string): Promise<PlayFabResponse> {
    return this.request({
      endpoint: '/Client/GetMatchmakingTicket',
      body: {
        QueueName: "battle_royale_26_50", // Default queue, can be parameterized
        TicketId: ticketId
      }
    });
  }

  /**
   * Submit match results
   */
  static async submitMatchResults(
    matchId: string,
    playerId: string,
    isWinner: boolean,
    statistics: Record<string, number>
  ): Promise<PlayFabResponse> {
    return this.request({
      endpoint: '/Client/UpdatePlayerStatistics',
      body: {
        Statistics: Object.entries(statistics).map(([name, value]) => ({
          StatisticName: name,
          Value: value
        }))
      }
    });
  }

  /**
   * Get matchmaking queue statistics (admin API)
   */
  static async getMatchmakingStats(queueName: string): Promise<PlayFabResponse> {
    // Note: This typically requires admin-level API access
    return this.request({
      endpoint: '/Admin/GetMatchmakingQueueStatistics',
      body: {
        QueueName: queueName
      }
    });
  }

  /**
   * Update match with room information
   */
  static async updateMatchWithRoomInfo(
    matchId: string,
    roomId: string,
    roomPassword: string
  ): Promise<PlayFabResponse> {
    return this.request({
      endpoint: '/Client/UpdateMatchmakingTicket',
      body: {
        MatchId: matchId,
        RoomId: roomId,
        RoomPassword: roomPassword
      }
    });
  }

  /**
   * Get match details including room information
   */
  static async getMatchDetails(matchId: string): Promise<PlayFabResponse> {
    return this.request({
      endpoint: '/Client/GetMatchmakingTicket',
      body: {
        MatchId: matchId
      }
    });
  }
  
  /**
   * Start game session with specific room information
   */
  static async startGameSession(
    matchId: string,
    roomId: string,
    roomPassword: string
  ): Promise<PlayFabResponse> {
    return this.request({
      endpoint: '/Client/StartGameSession',
      body: {
        TitleId: this.titleId,
        MatchId: matchId,
        RoomId: roomId,
        RoomPassword: roomPassword
      }
    });
  }
}

export default PlayFabClient;

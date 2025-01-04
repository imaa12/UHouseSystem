  import { Injectable, EventEmitter } from '@angular/core';
  import { HttpClient, HttpHeaders } from '@angular/common/http';
  import { Observable, throwError } from 'rxjs';
  import { catchError } from 'rxjs/operators';
  import { BehaviorSubject } from 'rxjs';
  import { map } from 'rxjs/operators';

  interface UserProfile {
    username: string;
    profilePhoto: string;
    // Add any other properties in the user profile as needed
  }
  @Injectable({
    providedIn: 'root'
  })
  export class UserService {
    private apiUrl = 'http://localhost:3000';
    private tokenKey = 'jwtToken';
    private username: string | null = null;
    private userProfileSource = new BehaviorSubject<any>(null);
    userProfile$ = this.userProfileSource.asObservable();
    private reservationsSubject = new BehaviorSubject<any[]>([]);
    reservations$ = this.reservationsSubject.asObservable()  // Observable to subscribe to reservations

    tokenEmitter: EventEmitter<string> = new EventEmitter<string>();

    constructor(private http: HttpClient) {}

    getReviewRatings(): Observable<any> {
      return this.http.get<any>(`http://localhost:3000/reviews`);
    }

    fetchUserProfile() {
      this.http.get('http://localhost:3000/user-profile').subscribe(
        (data) => {
          console.log('User profile data:', data);
          this.userProfileSource.next(data); // Update the observable
        },
        (error) => console.error('Error fetching user profile:', error)
      );
    }

    getProfilePhoto(): Observable<string | null> {
      return this.userProfile$.pipe(
        map((profile: UserProfile | null) => profile?.profilePhoto || null)
      );
    }
  
    setUsername(username: string): void {
      this.username = username;
    }
  
    getUsername(): string | null {
      return this.username;
    }

    getToken(): string | null {
      return localStorage.getItem(this.tokenKey);
    }
    
    setToken(token: string): void {
      localStorage.setItem(this.tokenKey, token);
    }
    
    forgotPassword(email: string): Observable<any> {
      // Adding log to see if the function is called
      console.log('Forgot password requested for email:', email);
    
      // Making sure to handle error logging better
      return this.http.post(`${this.apiUrl}/forgot-password`, { email }).pipe(
        catchError(error => {
          console.error('Forgot password error:', error);
    
          // Optionally, show error to the user through some UI
          return throwError(error);
        })
      );
    }
    
  
    resetPassword(token: string, newPassword: string): Observable<any> {
      const resetUrl = `${this.apiUrl}/reset-password/${token}`;
      const body = { password: newPassword };
    
      console.log('Reset password request sent to:', resetUrl);
      console.log('New password being sent:', newPassword);
    
      return this.http.post(resetUrl, body).pipe(
        catchError(error => {
          console.error('Error during reset password:', error);
          return throwError(error); // Improved error logging and handling
        })
      );
    }
    
    

    // Method to login and emit token
    login(email: string, password: string): void {
      this.http.post<any>(`${this.apiUrl}/login`, { email, password }).subscribe(
        response => {
          console.log('Login successful');
          const token = response.token;
          this.setToken(token);
          this.tokenEmitter.emit(token);
        },
        error => {
          console.error('Error logging in', error);
        }
      );
    }

    emitToken(token: string) {
      this.tokenEmitter.emit(token);
    }
     
   
    logout(): void {
      localStorage.removeItem(this.tokenKey);
      this.tokenEmitter.emit('');
    }



    getUserProfile(): Observable<any> {
      const token = this.getToken();
      if (!token) {
        return throwError('JWT token is missing');
      }
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      return this.http.get(`${this.apiUrl}/user/profile`, { headers }).pipe(
        catchError(error => throwError(error))
      );
    }

    updateUserProfile(user: any): Observable<any> {
      const token = this.getToken();
      if (!token) {
        return throwError('JWT token is missing');
      }
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

      return this.http.put(`${this.apiUrl}/user/profile`, user, { headers }).pipe(
        catchError(error => throwError(error))
      );
    }

    changeUserPassword(currentPassword: string, newPassword: string): Observable<any> {
      const token = this.getToken();
      if (!token) {
        return throwError('JWT token is missing');
      }
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      const body = { currentPassword, newPassword };
    
      return this.http.post(`${this.apiUrl}/user/change-password`, body, { headers }).pipe(
        catchError(error => throwError(error))
      );
    }
    
    uploadFile(file: File, roomData: any): Observable<any> {
      console.log('dataservicemasuk', roomData)
      const formData = new FormData();
      formData.append('roomImg', file, file.name);
      formData.append('roomType', roomData.roomType);
      formData.append('roomNum', roomData.roomNum);
      formData.append('roomPrice', roomData.roomPrice);
      formData.append('roomDesc', roomData.roomDesc);
      formData.append('roomBathroom', roomData.roomBathroom);
      formData.append('roomFloor', roomData.roomFloor);
      formData.append('bedType', roomData.bedType);
      formData.append('numBeds', roomData.numBeds);
      const token = this.getToken();
      if (!token) {
        return throwError('JWT token is missing');
      }
    
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
      return this.http.post<any>(`${this.apiUrl}/roommanages`, formData, { headers }).pipe(
        catchError(error => throwError(error))
      );
    }
    
    getRooms(): Observable<any[]> {
      const token = this.getToken();
      if (!token) {
        return throwError('JWT token is missing');
      }
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    
      return this.http.get<any[]>(`${this.apiUrl}/roommanages`, { headers }).pipe(
        catchError(error => throwError(error))
      );
    }

    generateFavRooms(): Observable<any[]> {
      const token = this.getToken();
      if (!token) {
        return throwError('JWT token is missing');
      }
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    
      return this.http.get<any[]>(`${this.apiUrl}/generate-fav-room`, { headers }).pipe(
        catchError(error => throwError(error))
      );
    }

    updateRoom(roomId: string, roomData: FormData): Observable<any> {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.getToken()}`
      });
    
      return this.http.put<any>(`${this.apiUrl}/roommanages/${roomId}`, roomData, { headers });
    }
    

    deleteRoom(roomId: string): Observable<any> {
      return this.http.delete(`${this.apiUrl}/roommanages/${roomId}`, this.getHttpOptions()).pipe(
        catchError(this.handleError)
      );
    }
  
    private getHttpOptions() {
      const token = localStorage.getItem(this.tokenKey);
      return {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        })
      };
    }
  
    private handleError(error: any) {
      console.error('An error occurred', error);
      return throwError(error);
    }

    // user.service.ts
deleteUserProfilePhoto(): Observable<any> {
  const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem(this.tokenKey)}`);
        // Log the request details
        console.log('Deleting user profile photo');
        console.log('Headers:', headers);
  return this.http.delete(`${this.apiUrl}/api/user/delete-photo`, { headers });
}

//additional request
saveGuestRequest(requestData: any): Observable<any> {
  const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  return this.http.post<any>(`${this.apiUrl}/api/guest-request`, requestData, { headers });
}

  // Fetch guest requests from the server
  getGuestRequests(): Observable<any> {
    return this.http.get(`${this.apiUrl}/guest-requests`);
  }

  updateRequestStatus(requestId: string, requestType: string, status: string, declineReason?: string, approveMessage?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/requests/update/${requestId}`, { requestType, status, declineReason, approveMessage });
  }
  
  

// user.service.ts

fetchReviews(token: string, reservationId: string): Observable<any> {
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  const url = `http://localhost:3000/api/reviews/${reservationId}`;

  return this.http.get<any>(url, { headers }).pipe(
    catchError((error) => {
      if (error.status === 404) {
        console.warn('No reviews found for this reservation');
      }
      return throwError(() => error);
    })
  );
}

getallReservations(): Observable<any> {
  return this.http.get(`${this.apiUrl}`);
}

makeReservation(reservation: any) {
  const headers = { Authorization: `Bearer ${this.getToken()}` };
  return this.http.post('http://localhost:3000/reservation', reservation, { headers });
}

cancelReservation(reservationId: String): Observable<any> {
  return this.http.delete(`${this.apiUrl}/${reservationId}`);
}

// user.service.ts
fetchReservationById(token: string, _id: string): Observable<any> {
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  const url = `http://localhost:3000/api/reservation/${_id}`; // Ensure `apiUrl` includes `/api`
  console.log('Request URL:', url); // Log the exact URL
  return this.http.get<any>(url, { headers });
}
  updateReservations(reservations: any[]) {
    this.reservationsSubject.next(reservations);
  }

  // Method to get all reservations
  getReservations() {
    return this.reservationsSubject.asObservable();
    }
  getAllReservations(): Observable<any[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.getToken()}`);
    return this.http.get<any[]>(`${this.apiUrl}/reservation`, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching all reservations:', error);
        return throwError(error);
      })
    );
  }

  
  // Method to add a reservation
  addReservation(reservation: any) {
    console.log("Adding reservation:", reservation);  // Debugging line
    const currentReservations = this.reservationsSubject.getValue();
    this.reservationsSubject.next([...currentReservations, reservation]);
  }
  
  fetchReservations(token: string): Observable<any> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    console.log('Headers:', headers); // Log headers for debugging
    return this.http.get(`${this.apiUrl}/reservation`, { headers }).pipe(
      catchError(error => {
        console.error('Error in fetchReservations:', error);
        return throwError(error);
      })
    );
  }





}

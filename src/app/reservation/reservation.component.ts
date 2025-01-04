import {
  Component, ViewChild, ElementRef,
  AfterViewInit, ChangeDetectorRef, OnInit
} from '@angular/core';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router'
import { param } from 'jquery';
declare const Swal: any;



@Component({
  selector: 'app-reservation',
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.css']
})



export class ReservationComponent implements OnInit {

  checkIn: Date | null = null;
  checkOut: Date | null = null;
  adults: Number | null = null;
  children: Number | null = null;

  token: string | null = null;

  rooms: any[] = [];

  roomId: string = '';
  roomType: string = '';
  roomDesc: string = '';
  roomImgUrl: string = '';

  reservation = {
    roomManageId: '',
    name: '',
    email: '',
    checkInDate: '',
    checkOutDate: '',
    adults: 0,
    children: 0,
    roomType: '',
    roomDesc: '',
    total: 0
  };

  constructor(private userService: UserService,
    private router: Router,
    private http: HttpClient, 
    private route: ActivatedRoute) { } 
    

  ngOnInit(): void {
    this.userService.tokenEmitter.subscribe((token: string) => {
      this.token = token;
      console.log('Token received:', this.token);
    });

    this.token = this.userService.getToken();
    if (this.token) {
      console.log('Token retrieved from storage:', this.token);
    }

    this.fetchRooms();

    const roomDetails = JSON.parse(localStorage.getItem('roomDetails') || '{}');
    if (roomDetails) {
      this.roomType = roomDetails.roomType;
      this.roomDesc = roomDetails.roomDesc;
      this.roomImgUrl = roomDetails.roomImgUrl;
    }
  }

  fetchRooms() {
    this.userService.getRooms().subscribe({
      next: rooms => {
        this.rooms = rooms.map(room => ({
          ...room,
          roomImgUrl: `http://localhost:3000/${room.roomImg}`
        }));
        console.log('Rooms fetched successfully:', this.rooms);
      },
      error: error => {
        console.error('Error fetching rooms:', error);
      }
    });
  }

  submitReservation() {
    const total = this.calculateTotal();
    this.reservation.total = total;
  
    // Show confirmation popup
    Swal.fire({
      icon: 'question',
      title: 'Confirm Reservation',
      text: `Your total is ${total}. Do you want to proceed with the reservation?`,
      showCancelButton: true,
      confirmButtonText: 'Yes, proceed',
      cancelButtonText: 'Cancel',
    }).then((result: any) => {
      if (result.isConfirmed) {
        // Add reservation to the UserService
        this.userService.addReservation(this.reservation);
  
        console.log('Reservation data being sent:', this.reservation); // Debugging line
  
        this.userService.makeReservation(this.reservation).subscribe({
          next: (response) => {
            console.log('Reservation successful:', response);
  
            // Success Swal popup
            Swal.fire({
              icon: 'success',
              title: 'Reservation Successful!',
              text: 'Your reservation has been successfully created.',
              confirmButtonText: 'OK',
            }).then(() => {
              this.router.navigate(['/dashboardGuest']); // Redirect user after success
            });
          },
          error: (error) => {
            console.error('Error creating reservation:', error);
  
            // Error Swal popup
            Swal.fire({
              icon: 'warning',
              title: 'Error',
              text: 'There was an issue creating your reservation. Please try again.',
              confirmButtonText: 'OK',
            });
          },
        });
      } else {
        // Cancelled reservation
        console.log('Reservation cancelled by user.');
        Swal.fire({
          icon: 'info',
          title: 'Reservation Cancelled',
          text: 'Your reservation has not been submitted.',
          confirmButtonText: 'OK',
        });
      }
    });
  }
  

  // submitReservation() {
  //   const total = this.calculateTotal();
  //   this.reservation.total = total;

  //   // Add reservation to the UserService
  //   this.userService.addReservation(this.reservation);
  //   alert('Reservation successful!');
  
  //   console.log('Reservation data being sent:', this.reservation); // Debugging line
  
  //   this.userService.makeReservation(this.reservation).subscribe({
  //     next: (response) => {
  //       console.log('Reservation successful:', response);
  //       alert('Reservation successful!');
  //       this.router.navigate(['/dashboardGuest']); // Redirect user after success
  //     },
  //     error: (error) => {
  //       console.error('Error creating reservation:', error);
  //       alert('Error creating reservation. Please try again.');
  //     } 
  //   });
  // }

  onRoomTypeChange() {
    const selectedRoom = this.rooms.find(room => room.roomType === this.reservation.roomType);
    if (selectedRoom) {
      this.reservation.roomDesc = selectedRoom.roomDesc;
      this.reservation.roomManageId = selectedRoom._id
      this.calculateTotal();  // Recalculate total price
    }
  }
  

  calculateTotal(): number {
    const basePrice = 100; // Example base price per night
    const nights = Math.ceil(
      (new Date(this.reservation.checkOutDate).getTime() -
        new Date(this.reservation.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return nights * basePrice;
  }

  logout() {
    this.userService.logout();
    this.router.navigate(['/landing-page']);
  }

}
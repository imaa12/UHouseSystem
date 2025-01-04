import { Component, ViewChild, ElementRef, ChangeDetectorRef, OnInit } from '@angular/core';
import { UserService } from '../services/user.service'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  @ViewChild('room', { static: true }) room!: ElementRef;
  @ViewChild('service', { static: true }) service!: ElementRef;
  @ViewChild('contact', { static: true }) contact!: ElementRef;
  @ViewChild('about', { static: true }) about!: ElementRef;

  roomRef!: ElementRef;
  serviceRef!: ElementRef;
  contactRef!: ElementRef;
  aboutRef!: ElementRef;
  favRoomId: string = '';

  rooms: any[] = [];
  token: string | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
      this.fetchRooms(); // Panggil fetchRooms tanpa memeriksa token
      this.token = this.userService.getToken();
      if (this.token) {
        console.log('Token retrieved:', this.token);
        this.fetchFavRoom(); // Fetch favorit hanya jika ada token
      }
    }
    

    fetchRooms() {
      this.userService.getRooms().subscribe({
        next: (rooms) => {
          this.rooms = rooms.map((room) => ({
            ...room,
            roomImgUrl: `http://localhost:3000/${room.roomImg}`,
          }));
          console.log('Rooms fetched:', this.rooms);
        },
        error: (error) => {
          console.error('Error fetching rooms:', error);
        },
      });
    }

  fetchFavRoom() {
    this.userService.generateFavRooms().subscribe({
      next: (data: any) => {
        console.log('Favorite room data:', data);
        this.favRoomId = data.roomId[0];

        const index = this.rooms.findIndex((obj) => obj._id === this.favRoomId);
        if (index !== -1) {
          const [favRoom] = this.rooms.splice(index, 1);
          this.rooms.unshift(favRoom);
        }
      },
      error: (error) => {
        console.error('Error fetching favorite room:', error);
      },
    });
  }

  viewRoom(room: any) {
    console.log('View room:', room);
    localStorage.setItem('roomDetails', JSON.stringify(room));
    this.router.navigate(['/room-details']);
  }
    ngAfterViewInit() {
    // Use setTimeout to defer the assignments to the next JavaScript turn
    setTimeout(() => {
      this.roomRef = this.room;
      this.serviceRef = this.service;
      this.contactRef = this.contact;
      this.aboutRef = this.about;
      
      // Manually trigger change detection
      this.cdr.detectChanges();
    }, 0);
  }

}


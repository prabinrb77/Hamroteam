use strict;
use warnings;
use IO::Socket::INET;

my $base = '/Users/prabin/Documents/GitHub/Hamroteam';
my %types = ('.html' => 'text/html', '.css' => 'text/css', '.js' => 'application/javascript');

my $server = IO::Socket::INET->new(
    LocalPort => 4321,
    Proto     => 'tcp',
    Listen    => 20,
    Reuse     => 1,
) or die "Could not create socket: $!\n";

$| = 1;
print "Listening on 4321, serving $base\n";

while (my $client = $server->accept()) {
    my $request_line = <$client>;
    unless (defined $request_line) { close $client; next; }

    while (my $line = <$client>) {
        last if $line =~ /^\r?\n$/;
    }

    if ($request_line =~ m{^GET\s+(\S+)\s+HTTP}) {
        my $path = $1;
        $path =~ s/\?.*$//;
        $path = '/index.html' if $path eq '/';
        $path =~ s{\.\.}{}g;
        my $file = $base . $path;

        if (-f $file) {
            open(my $fh, '<:raw', $file) or do {
                print $client "HTTP/1.0 500 Internal Server Error\r\nConnection: close\r\n\r\n";
                close $client;
                next;
            };
            local $/;
            my $body = <$fh>;
            close $fh;
            my ($ext) = $file =~ /(\.[^.\/]+)$/;
            my $ctype = $types{$ext // ''} || 'application/octet-stream';
            print $client "HTTP/1.0 200 OK\r\nContent-Type: $ctype\r\nContent-Length: " . length($body) . "\r\nConnection: close\r\n\r\n$body";
        } else {
            my $body = "Not Found: $path";
            print $client "HTTP/1.0 404 Not Found\r\nContent-Type: text/plain\r\nContent-Length: " . length($body) . "\r\nConnection: close\r\n\r\n$body";
        }
    }
    close $client;
}

from cassandra.cluster import Cluster
from cassandra.query import dict_factory

def get_cassandra_session():
    cluster = Cluster(['localhost'])
    session = cluster.connect('apimonitor')
    session.row_factory = dict_factory
    return session
